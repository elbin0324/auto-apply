import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Profile, Skill
from models.user import User

logger = logging.getLogger(__name__)


# ── Pure scoring functions ────────────────────────────────────────────────────


def _tokenize(text: str | None) -> set[str]:
    if not text:
        return set()
    return set(re.findall(r"[a-z0-9#+.]+", text.lower()))


def _compute_skill_score(user_skills: list[str], job_text: str) -> float:
    """0–50 pts: fraction of user skills found in job text."""
    if not user_skills:
        return 0.0
    job_tokens = _tokenize(job_text)
    matched = sum(1 for skill in user_skills if skill.lower().strip() in job_tokens)
    return (matched / len(user_skills)) * 50.0


def _compute_title_score(target_titles: list[str], job_title: str) -> float:
    """0–30 pts: best Jaccard overlap between any target title and the job title."""
    if not target_titles or not job_title:
        return 0.0
    job_tokens = _tokenize(job_title)
    best = 0.0
    for title in target_titles:
        target_tokens = _tokenize(title)
        if not target_tokens:
            continue
        union = target_tokens | job_tokens
        intersection = target_tokens & job_tokens
        ratio = len(intersection) / len(union) if union else 0.0
        best = max(best, ratio)
    return best * 30.0


def _compute_location_score(
    profile_location: str | None,
    target_locations: list[str] | None,
    job_location: str | None,
    job_location_type: str | None,
) -> float:
    """0–20 pts: remote always matches; else check location string overlap."""
    if job_location_type and "remote" in job_location_type.lower():
        return 20.0
    if not job_location:
        return 0.0
    job_loc_lower = job_location.lower()

    if target_locations:
        for loc in target_locations:
            if loc and loc.lower() in job_loc_lower:
                return 20.0

    if profile_location:
        user_words = _tokenize(profile_location)
        job_words = _tokenize(job_location)
        if user_words & job_words:
            return 20.0

    return 0.0


def score_job_for_user(
    skill_names: list[str],
    target_titles: list[str],
    profile_location: str | None,
    target_locations: list[str] | None,
    job_title: str,
    job_description: str | None,
    job_location: str | None,
    job_location_type: str | None,
) -> tuple[float, dict]:
    """Compute 0–100 heuristic score for one user × job pair."""
    job_text = f"{job_title} {job_description or ''}"

    skill_score = _compute_skill_score(skill_names, job_text)
    title_score = _compute_title_score(target_titles, job_title)
    location_score = _compute_location_score(
        profile_location,
        target_locations,
        job_location,
        job_location_type,
    )

    total = round(skill_score + title_score + location_score, 2)
    factors = {
        "skill_score": round(skill_score, 2),
        "title_score": round(title_score, 2),
        "location_score": round(location_score, 2),
    }
    return total, factors


# ── Bulk scoring after sync ───────────────────────────────────────────────────


async def compute_scores_for_sync(
    db: AsyncSession,
    synced_external_ids: list[str],
) -> dict:
    if not synced_external_ids:
        return {"scores_computed": 0}

    jobs_result = await db.execute(
        select(Job).where(
            Job.external_id.in_(synced_external_ids),
            Job.is_active.is_(True),
        )
    )
    jobs = jobs_result.scalars().all()
    if not jobs:
        return {"scores_computed": 0}

    users_result = await db.execute(
        select(User)
        .join(AutoApplyConfig, User.id == AutoApplyConfig.user_id)
        .join(Profile, User.id == Profile.user_id)
        .where(AutoApplyConfig.is_active.is_(True))
        .options(
            selectinload(User.profile).selectinload(Profile.skills),
            selectinload(User.auto_apply_config),
        )
    )
    users = users_result.unique().scalars().all()
    if not users:
        return {"scores_computed": 0}

    score_rows: list[dict] = []
    now = datetime.now(timezone.utc)

    for user in users:
        profile = user.profile
        config = user.auto_apply_config
        if not profile:
            continue

        skill_names = [s.name for s in (profile.skills or [])]
        target_titles = list(config.target_titles or []) if config else []
        target_locations = list(config.target_locations or []) if config else []

        for job in jobs:
            score, factors = score_job_for_user(
                skill_names=skill_names,
                target_titles=target_titles,
                profile_location=profile.location,
                target_locations=target_locations,
                job_title=job.title or "",
                job_description=job.description,
                job_location=job.location,
                job_location_type=job.location_type,
            )
            score_rows.append({
                "user_id": user.id,
                "job_id": job.id,
                "score": score,
                "factors": factors,
                "computed_at": now,
            })

    if not score_rows:
        return {"scores_computed": 0}

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

    logger.info("Computed %d job match scores", len(score_rows))
    return {"scores_computed": len(score_rows)}


async def get_score_for_user_job(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
) -> JobMatchScore | None:
    result = await db.execute(
        select(JobMatchScore).where(
            JobMatchScore.user_id == user_id,
            JobMatchScore.job_id == job_id,
        )
    )
    return result.scalar_one_or_none()
