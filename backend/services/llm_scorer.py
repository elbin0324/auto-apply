"""LLM-based job scoring — batched scoring of jobs against user profiles.

Replaces the heuristic scorer for the primary scoring pipeline. All fetched
jobs are sent to the LLM (no heuristic pre-filter) because JSearch already
pre-filters by the user's target titles/locations at the API level.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import get_settings
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Education, Experience, Profile
from models.user import User
from schemas.enrichment import EnrichJobsTask
from schemas.scoring import LLMScoreFactors, LLMScoreResult
from services.enrich_queue_service import push_enrich_task
from services.llm_provider import LLMProvider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SCORING_SYSTEM_PROMPT = """\
You are a job-candidate match scorer. You will receive a candidate profile \
and a batch of job listings. For each job, output a match score and skills analysis.

Score guidelines:
- 90-100: Near-perfect match. Candidate meets all required skills, experience level, and preferences.
- 70-89: Strong match. Candidate meets most requirements with minor gaps.
- 50-69: Moderate match. Some relevant skills but notable gaps.
- 30-49: Weak match. Few overlapping skills or wrong experience level.
- 0-29: Poor match. Wrong field, level, or location entirely.

Consider these factors (in order of importance):
1. Skills overlap — does the candidate have the required technical skills?
2. Experience level — does the candidate's seniority match the role?
3. Title relevance — is this the type of role the candidate is targeting?
4. Location fit — does the job location/type match candidate preferences?
5. Industry/domain — is there relevant domain experience?

Return ONLY valid JSON — an array of objects, one per job, in the same order:
[
  {
    "job_index": 0,
    "score": 78,
    "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
    "missing_skills": ["Kubernetes", "Terraform"],
    "preferred_skills": ["Go"],
    "reasoning": "Strong backend match but lacks infrastructure experience"
  }
]

Rules:
- matched_skills: skills the candidate HAS that the job REQUIRES or PREFERS
- missing_skills: skills the job REQUIRES that the candidate LACKS
- preferred_skills: skills the job lists as PREFERRED/NICE-TO-HAVE that the candidate HAS
- reasoning: one sentence explaining the score (under 20 words)
- Be accurate about skill matching — don't inflate scores
- If the job description is sparse, score conservatively (40-60 range)
- Keep skills lists concise (top 5-8 each, most relevant first)"""


# ---------------------------------------------------------------------------
# Context builders
# ---------------------------------------------------------------------------


def _build_user_context(profile: Profile, config: AutoApplyConfig | None) -> str:
    """Build a compact text representation of the candidate for the LLM."""
    skill_names = [s.name for s in (profile.skills or [])]

    parts: list[str] = [
        "CANDIDATE PROFILE:",
        f"Name: {profile.full_name or 'Unknown'}",
        f"Location: {profile.location or 'Not specified'}",
    ]

    if profile.summary:
        parts.append(f"Summary: {profile.summary[:300]}")

    if skill_names:
        parts.append(f"Skills: {', '.join(skill_names)}")

    # Recent experience (top 3 by sort_order)
    experiences: list[Experience] = sorted(
        (profile.experiences or []),
        key=lambda x: x.sort_order,
    )[:3]
    if experiences:
        parts.append("Recent Experience:")
        for exp in experiences:
            line = f"  - {exp.title} at {exp.company}"
            if exp.description:
                line += f" ({exp.description[:100]})"
            parts.append(line)

    # Education (top 2)
    educations: list[Education] = sorted(
        (profile.educations or []),
        key=lambda x: x.sort_order,
    )[:2]
    if educations:
        parts.append("Education:")
        for edu in educations:
            parts.append(
                f"  - {edu.degree or ''} {edu.field_of_study or ''} at {edu.institution}"
            )

    if config:
        pref_parts: list[str] = []
        if config.target_titles:
            pref_parts.append(f"Target roles: {', '.join(config.target_titles)}")
        if config.target_locations:
            pref_parts.append(f"Target locations: {', '.join(config.target_locations)}")
        if config.location_type_pref:
            pref_parts.append(f"Work type: {', '.join(config.location_type_pref)}")
        if config.experience_level:
            pref_parts.append(f"Experience level: {config.experience_level}")
        if pref_parts:
            parts.append("Job Preferences:")
            parts.extend(f"  {p}" for p in pref_parts)

    return "\n".join(parts)


def _build_jobs_batch_prompt(jobs: list[Job]) -> str:
    """Build a prompt listing multiple jobs for batch scoring."""
    parts = ["Score the following jobs against the candidate profile:\n"]

    for i, job in enumerate(jobs):
        desc = (job.description or "")[:800]
        parts.append(f"--- JOB {i} ---")
        parts.append(f"Title: {job.title}")
        if job.company:
            parts.append(f"Company: {job.company}")
        if job.location:
            parts.append(f"Location: {job.location}")
        if job.location_type:
            parts.append(f"Work type: {job.location_type}")
        if job.salary_min or job.salary_max:
            parts.append(f"Salary: ${job.salary_min or '?'}-${job.salary_max or '?'}")
        parts.append(f"Description: {desc}")
        parts.append("")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Batch scoring
# ---------------------------------------------------------------------------


async def _score_batch_llm(
    provider: LLMProvider,
    user_context: str,
    jobs: list[Job],
    batch_index: int,
) -> tuple[list[LLMScoreResult], int]:
    """Score a batch of jobs via LLM.

    Returns (parsed results, latency_ms).
    """
    settings = get_settings()
    prompt = _build_jobs_batch_prompt(jobs)
    messages = [{"role": "user", "content": f"{user_context}\n\n{prompt}"}]

    start = time.monotonic()
    try:
        response_text = await provider.complete(
            messages,
            system=SCORING_SYSTEM_PROMPT,
            model=settings.scoring_model,
            max_tokens=settings.scoring_max_tokens,
        )
        latency_ms = int((time.monotonic() - start) * 1000)

        # Strip markdown fences if the model wraps JSON in ```
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        raw_results = json.loads(cleaned)
        if not isinstance(raw_results, list):
            raw_results = [raw_results]

        results = [LLMScoreResult.model_validate(r) for r in raw_results]
        return results, latency_ms

    except json.JSONDecodeError:
        logger.warning("LLM returned non-JSON for batch %d", batch_index)
        return [], 0
    except Exception:
        logger.exception("LLM scoring failed for batch %d", batch_index)
        return [], 0


# ---------------------------------------------------------------------------
# Per-user scoring
# ---------------------------------------------------------------------------


async def _score_jobs_for_user(
    provider: LLMProvider,
    user: User,
    jobs: list[Job],
) -> list[dict]:
    """Score all jobs for one user. Returns list of score row dicts for upsert."""
    settings = get_settings()
    profile = user.profile
    config = user.auto_apply_config
    if not profile:
        return []

    user_context = _build_user_context(profile, config)

    # Batch jobs
    batch_size = settings.scoring_batch_size
    batches = [jobs[i : i + batch_size] for i in range(0, len(jobs), batch_size)]
    batch_id = str(uuid.uuid4())[:8]

    # Run batches concurrently — provider semaphore handles rate limiting
    tasks = [
        _score_batch_llm(provider, user_context, batch, idx)
        for idx, batch in enumerate(batches)
    ]
    all_results = await asyncio.gather(*tasks)

    score_rows: list[dict] = []
    now = datetime.now(timezone.utc)

    for batch, (results, latency_ms) in zip(batches, all_results):
        for result in results:
            if result.job_index < 0 or result.job_index >= len(batch):
                logger.warning(
                    "LLM returned out-of-range job_index %d for batch of %d",
                    result.job_index,
                    len(batch),
                )
                continue

            job = batch[result.job_index]
            llm_score = max(0.0, min(100.0, result.score))

            if llm_score >= settings.score_min_threshold:
                factors = LLMScoreFactors(
                    combined_method="llm",
                    model=settings.scoring_model,
                    matched_skills=result.matched_skills,
                    missing_skills=result.missing_skills,
                    preferred_skills=result.preferred_skills,
                    reasoning=result.reasoning,
                    batch_id=batch_id,
                    latency_ms=latency_ms,
                )
                score_rows.append(
                    {
                        "user_id": user.id,
                        "job_id": job.id,
                        "score": llm_score,
                        "factors": factors.model_dump(),
                        "computed_at": now,
                    }
                )

    return score_rows


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


async def _load_active_users(db: AsyncSession) -> list[User]:
    """Load active users with profile, skills, experiences, and educations."""
    result = await db.execute(
        select(User)
        .join(AutoApplyConfig, User.id == AutoApplyConfig.user_id)
        .join(Profile, User.id == Profile.user_id)
        .where(AutoApplyConfig.is_active.is_(True))
        .options(
            selectinload(User.profile).selectinload(Profile.skills),
            selectinload(User.profile).selectinload(Profile.experiences),
            selectinload(User.profile).selectinload(Profile.educations),
            selectinload(User.auto_apply_config),
        )
    )
    return list(result.unique().scalars().all())


async def score_new_jobs_llm(
    db: AsyncSession,
    provider: LLMProvider,
    job_ids: list[uuid.UUID],
) -> dict:
    """Score new jobs against all active users via LLM.

    This is the main entry point called by the ScoreWorker when
    scoring_use_llm is enabled. Replaces score_service.score_new_jobs_for_users().
    """
    settings = get_settings()

    users = await _load_active_users(db)
    if not users:
        return {"users_checked": 0, "scores_upserted": 0}

    # Load the specific jobs
    jobs_result = await db.execute(
        select(Job).where(Job.id.in_(job_ids), Job.is_active.is_(True))
    )
    jobs = list(jobs_result.scalars().all())
    if not jobs:
        return {"users_checked": len(users), "scores_upserted": 0, "jobs_available": 0}

    total_upserted = 0

    for user in users:
        score_rows = await _score_jobs_for_user(provider, user, jobs)

        if score_rows:
            stmt = pg_insert(JobMatchScore).values(score_rows)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_job_match_scores_user_job",
                set_={
                    "score": stmt.excluded.score,
                    "factors": stmt.excluded.factors,
                    "computed_at": stmt.excluded.computed_at,
                },
            )
            await db.execute(stmt)
            total_upserted += len(score_rows)

    # Optionally push top-N to enrich queue
    if settings.scoring_enrich_after_score:
        jobs_to_enrich: set[uuid.UUID] = set()
        for user in users:
            scored = await db.execute(
                select(JobMatchScore.job_id, JobMatchScore.score)
                .where(
                    JobMatchScore.user_id == user.id,
                    JobMatchScore.job_id.in_(job_ids),
                )
                .order_by(JobMatchScore.score.desc())
                .limit(settings.jsearch_top_n_to_enrich)
            )
            for jid, _ in scored.all():
                jobs_to_enrich.add(jid)

        if jobs_to_enrich:
            unenriched_result = await db.execute(
                select(Job.id).where(
                    Job.id.in_(list(jobs_to_enrich)),
                    Job.enriched_at.is_(None),
                    Job.description.isnot(None),
                )
            )
            unenriched_ids = list(unenriched_result.scalars().all())
            if unenriched_ids:
                enrich_task = EnrichJobsTask(job_ids=unenriched_ids)
                await push_enrich_task(enrich_task, source="score_worker")
                logger.info("Pushed %d jobs to enrich queue", len(unenriched_ids))

    logger.info(
        "LLM scored %d jobs for %d users, upserted %d scores",
        len(jobs),
        len(users),
        total_upserted,
    )
    return {
        "users_checked": len(users),
        "jobs_scored": len(jobs),
        "scores_upserted": total_upserted,
    }
