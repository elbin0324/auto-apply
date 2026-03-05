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
from models.profile import Education, Experience, Profile
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

    Filters applied:
    - Job.is_active == True
    - Title ILIKE any of config.target_titles
    - location_type IN config.location_type_pref (NULL passes through)
    - salary_min >= config.min_salary (NULL passes through)
    - salary_max <= config.max_salary (NULL passes through)
    - company NOT ILIKE any excluded company name
    """
    stmt = select(Job).where(Job.is_active.is_(True))

    # Title filter — match any target title
    titles = list(config.target_titles or [])
    if titles:
        from sqlalchemy import or_

        title_conditions = [Job.title.ilike(f"%{t}%") for t in titles]
        stmt = stmt.where(or_(*title_conditions))

    # Location type filter
    location_prefs = list(config.location_type_pref or [])
    if location_prefs:
        stmt = stmt.where(
            Job.location_type.in_(location_prefs) | Job.location_type.is_(None)
        )

    # Salary filters (NULL passes through)
    if config.min_salary is not None:
        stmt = stmt.where(
            (Job.salary_min >= config.min_salary) | Job.salary_min.is_(None)
        )
    if config.max_salary is not None:
        stmt = stmt.where(
            (Job.salary_max <= config.max_salary) | Job.salary_max.is_(None)
        )

    # Excluded companies
    excluded = list(config.excluded_companies or [])
    if excluded:
        from sqlalchemy import and_

        for company_name in excluded:
            stmt = stmt.where(
                (Job.company.is_(None)) | ~Job.company.ilike(f"%{company_name}%")
            )

    result = await db.execute(stmt)
    return list(result.scalars().all())


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
