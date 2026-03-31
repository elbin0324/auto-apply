"""LLM-based job scoring — batched scoring of jobs against user profiles.

Replaces the heuristic scorer for the primary scoring pipeline. All fetched
jobs are sent to the LLM (no heuristic pre-filter) because the Fantastic Jobs API
already pre-filters by the user's target titles/locations at the API level.
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

from config import get_settings
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Education, Experience, Profile
from models.user import User
from schemas.scoring import LLMScoreFactors, LLMScoreResult, StructuredAnalysis
from workers.services.job_filter import (
    filter_candidate_jobs,
    get_unscored_job_ids,
    load_user_with_profile,
)
from infra.llm_service import LLMProvider

logger = logging.getLogger(__name__)

SCORING_MAX_JOBS_PER_TASK = 100

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SCORING_SYSTEM_PROMPT = """\
You are a job-candidate match scorer. You will receive a candidate profile \
and a batch of job listings. For each job, output a match score, skills analysis, \
and structured fit analysis.

Score guidelines:
- 90-100: Near-perfect match. Candidate meets all required skills, experience level, and preferences.
- 70-89: Strong match. Candidate meets most requirements with minor gaps.
- 50-69: Moderate match. Some relevant skills but notable gaps.
- 30-49: Weak match. Few overlapping skills or wrong experience level.
- 0-29: Poor match. Wrong field, level, or location entirely.

Consider these factors (in order of importance):
1. Skills overlap — does the candidate have the required technical skills? Use keywords and core responsibilities for matching.
2. Experience level — does the candidate's seniority match the role?
3. Title relevance — is this the type of role the candidate is targeting?
4. Location fit — does the job location/type match candidate preferences?
5. Industry/domain — is there relevant domain experience?
6. Compensation alignment — does the salary range match expectations?
7. Additional signals — benefits, visa sponsorship, and other contextual factors.

Return ONLY valid JSON — an array of objects, one per job, in the same order:
[
  {
    "job_index": 0,
    "score": 78,
    "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
    "missing_skills": ["Kubernetes", "Terraform"],
    "preferred_skills": ["Go"],
    "reasoning": "Strong backend match but lacks infrastructure experience",
    "summary": "Build and maintain backend services for a fintech platform.",
    "strengths": [
      "Your Python and FastAPI experience directly matches the core requirements",
      "Your production deployment experience demonstrates operational maturity"
    ],
    "concerns": [
      "No direct infrastructure/DevOps experience with Kubernetes"
    ],
    "key_matches": ["Python", "FastAPI", "PostgreSQL", "REST APIs"],
    "key_gaps": ["Kubernetes", "Terraform", "CI/CD pipelines"]
  }
]

Rules:
- matched_skills: skills the candidate HAS that the job REQUIRES or PREFERS
- missing_skills: skills the job REQUIRES that the candidate LACKS
- preferred_skills: skills the job lists as PREFERRED/NICE-TO-HAVE that the candidate HAS
- reasoning: one sentence explaining the score (under 20 words)
- summary: 1-2 sentence plain English summary of what the role involves
- strengths: 2-4 specific reasons this is a good match, referencing the candidate's actual experience. Write in second person ("your experience with...")
- concerns: 0-2 notable gaps or risks, be honest but constructive
- key_matches: top 4-7 qualifications the candidate has that the job values
- key_gaps: top 3-5 qualifications the job requires that the candidate lacks
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

        # Enrichment columns (always include when present)
        if job.experience_level:
            parts.append(f"Experience level: {job.experience_level}")
        if job.employment_type:
            parts.append(f"Employment type: {job.employment_type}")
        if job.years_experience_min or job.years_experience_max:
            parts.append(
                f"Years experience: {job.years_experience_min or '?'}-{job.years_experience_max or '?'}"
            )

        enrichment = job.ai_enrichment
        if enrichment and isinstance(enrichment, dict):
            # Use structured enrichment fields instead of raw description
            if enrichment.get("requirements_summary"):
                parts.append(f"Requirements: {enrichment['requirements_summary']}")
            if enrichment.get("core_responsibilities"):
                parts.append(f"Responsibilities: {enrichment['core_responsibilities']}")
            if enrichment.get("keywords"):
                parts.append(f"Keywords: {', '.join(enrichment['keywords'])}")
            if enrichment.get("benefits"):
                parts.append(f"Benefits: {enrichment['benefits']}")
            salary_info = enrichment.get("salary")
            if salary_info and isinstance(salary_info, dict):
                sal_parts = []
                if salary_info.get("currency"):
                    sal_parts.append(salary_info["currency"])
                if salary_info.get("min_value"):
                    sal_parts.append(f"min={salary_info['min_value']}")
                if salary_info.get("max_value"):
                    sal_parts.append(f"max={salary_info['max_value']}")
                if salary_info.get("unit_text"):
                    sal_parts.append(f"per {salary_info['unit_text']}")
                if sal_parts:
                    parts.append(f"Salary detail: {' '.join(sal_parts)}")
            if enrichment.get("education_level"):
                parts.append(f"Education: {', '.join(enrichment['education_level'])}")
            if enrichment.get("visa_sponsorship") is not None:
                parts.append(f"Visa sponsorship: {'Yes' if enrichment['visa_sponsorship'] else 'No'}")
            if enrichment.get("work_arrangement_office_days") is not None:
                parts.append(f"Office days/week: {enrichment['work_arrangement_office_days']}")
        else:
            # Fallback to raw description when no enrichment available
            desc = (job.description or "")[:800]
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
        snippet = response_text[:200] if response_text else "(empty)"
        logger.warning(
            "LLM returned non-JSON for batch %d — first 200 chars: %s",
            batch_index,
            snippet,
        )
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
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    score_rows: list[dict] = []
    now = datetime.now(timezone.utc)

    for idx, (batch, result) in enumerate(zip(batches, all_results)):
        if isinstance(result, BaseException):
            logger.error("Batch %d failed: %s", idx, result)
            continue
        results, latency_ms = result
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
                analysis = StructuredAnalysis(
                    summary=result.summary,
                    strengths=result.strengths,
                    concerns=result.concerns,
                    key_matches=result.key_matches,
                    key_gaps=result.key_gaps,
                )
                score_rows.append(
                    {
                        "user_id": user.id,
                        "job_id": job.id,
                        "score": llm_score,
                        "factors": factors.model_dump(),
                        "structured_analysis": analysis.model_dump(),
                        "computed_at": now,
                    }
                )

    return score_rows


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


async def score_new_jobs_llm(
    db: AsyncSession,
    provider: LLMProvider,
    user_id: uuid.UUID,
    *,
    force: bool = False,
) -> dict:
    """Score jobs for a single user via LLM.

    This is the main entry point called by the ScoreWorker when
    scoring_use_llm is enabled.

    1. Load the user with profile/config
    2. Pre-filter candidate jobs by user preferences
    3. Exclude already-scored jobs (unless force=True)
    4. LLM-score the remaining jobs
    5. Upsert scores to DB
    """
    user = await load_user_with_profile(db, user_id)
    if not user:
        logger.warning("User %s not found or missing profile/config, skipping", user_id)
        return {"jobs_scored": 0, "scores_upserted": 0}

    config = user.auto_apply_config
    jobs = await filter_candidate_jobs(db, config)
    if not jobs:
        return {"jobs_filtered": 0, "jobs_scored": 0, "scores_upserted": 0}

    job_ids = [j.id for j in jobs]

    if force:
        # Clear existing scores for this user so they get re-evaluated
        from sqlalchemy import delete

        await db.execute(
            delete(JobMatchScore).where(
                JobMatchScore.user_id == user_id,
                JobMatchScore.job_id.in_(job_ids),
            )
        )
        jobs_to_score = jobs
    else:
        unscored_ids = await get_unscored_job_ids(db, user_id, job_ids)
        if not unscored_ids:
            return {
                "jobs_filtered": len(jobs),
                "jobs_scored": 0,
                "scores_upserted": 0,
                "all_already_scored": True,
            }
        unscored_set = set(unscored_ids)
        jobs_to_score = [j for j in jobs if j.id in unscored_set]

    # Sort by posted_at descending (most recent first) and cap
    jobs_to_score.sort(
        key=lambda j: getattr(j, "posted_at", None) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    jobs_to_score = jobs_to_score[:SCORING_MAX_JOBS_PER_TASK]

    score_rows = await _score_jobs_for_user(provider, user, jobs_to_score)

    total_upserted = 0
    if score_rows:
        stmt = pg_insert(JobMatchScore).values(score_rows)
        if force:
            stmt = stmt.on_conflict_do_update(
                constraint="uq_job_match_scores_user_job",
                set_={
                    "score": stmt.excluded.score,
                    "factors": stmt.excluded.factors,
                    "structured_analysis": stmt.excluded.structured_analysis,
                    "computed_at": stmt.excluded.computed_at,
                },
            )
        else:
            stmt = stmt.on_conflict_do_nothing(
                constraint="uq_job_match_scores_user_job",
            )
        await db.execute(stmt)
        total_upserted = len(score_rows)

    logger.info(
        "LLM scored %d jobs for user %s, upserted %d scores (force=%s)",
        len(jobs_to_score),
        user_id,
        total_upserted,
        force,
    )
    return {
        "jobs_filtered": len(jobs),
        "jobs_scored": len(jobs_to_score),
        "scores_upserted": total_upserted,
    }
