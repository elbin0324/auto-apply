"""Shared helpers for per-user job filtering and scoring pre-checks.

Used by both LLM and heuristic scorers to load a single user,
pre-filter candidate jobs by preferences, and identify unscored jobs.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Profile
from models.user import User


async def load_user_with_profile(
    db: AsyncSession, user_id: uuid.UUID
) -> User | None:
    """Load a single user with profile, skills, experiences, educations, and config.

    Returns None if the user has no active config or no profile.
    """
    result = await db.execute(
        select(User)
        .join(AutoApplyConfig, User.id == AutoApplyConfig.user_id)
        .join(Profile, User.id == Profile.user_id)
        .where(User.id == user_id)
        .options(
            selectinload(User.profile).selectinload(Profile.skills),
            selectinload(User.profile).selectinload(Profile.experiences),
            selectinload(User.profile).selectinload(Profile.educations),
            selectinload(User.auto_apply_config),
        )
    )
    return result.unique().scalars().first()


async def filter_candidate_jobs(
    db: AsyncSession, config: AutoApplyConfig
) -> list[Job]:
    """Pre-filter active jobs by user preferences from AutoApplyConfig.

    Delegates to the shared ``get_scoped_jobs`` so that all filter logic
    lives in one place (``services.job_scope``).
    """
    from services.job_scope import get_scoped_jobs

    return await get_scoped_jobs(db, config)


async def get_unscored_job_ids(
    db: AsyncSession, user_id: uuid.UUID, job_ids: list[uuid.UUID]
) -> list[uuid.UUID]:
    """Return subset of job_ids that don't have a JobMatchScore row for this user."""
    if not job_ids:
        return []

    scored_result = await db.execute(
        select(JobMatchScore.job_id).where(
            JobMatchScore.user_id == user_id,
            JobMatchScore.job_id.in_(job_ids),
        )
    )
    scored_ids = set(scored_result.scalars().all())
    return [jid for jid in job_ids if jid not in scored_ids]
