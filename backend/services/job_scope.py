"""Unified job scope: single place for config-based job filtering.

Used by the scoring worker pre-filter, auto-apply matching, and the job listing endpoint
so that all three share identical filter logic.
"""

from sqlalchemy import Select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.auto_apply_config import AutoApplyConfig
from models.job import Job


def apply_config_scope(stmt: Select, config: AutoApplyConfig | None) -> Select:
    """Append WHERE clauses to *stmt* based on the user's AutoApplyConfig.

    If *config* is None, only applies ``Job.is_active == True``.
    Each filter is skipped when its config field is empty/None.
    NULL job columns always pass through (they are not excluded).
    """
    stmt = stmt.where(Job.is_active.is_(True))

    if config is None:
        return stmt

    # Title filter — match any target title (OR)
    titles = list(config.target_titles or [])
    if titles:
        title_conditions = [Job.title.ilike(f"%{t}%") for t in titles]
        stmt = stmt.where(or_(*title_conditions))

    # Location type filter
    location_prefs = list(config.location_type_pref or [])
    if location_prefs:
        stmt = stmt.where(Job.location_type.in_(location_prefs) | Job.location_type.is_(None))

    # Salary filters (NULL passes through)
    if config.min_salary is not None:
        stmt = stmt.where((Job.salary_min >= config.min_salary) | Job.salary_min.is_(None))
    if config.max_salary is not None:
        stmt = stmt.where((Job.salary_max <= config.max_salary) | Job.salary_max.is_(None))

    # Excluded companies (NULL company passes through)
    excluded = list(config.excluded_companies or [])
    for company_name in excluded:
        stmt = stmt.where(Job.company.is_(None) | ~Job.company.ilike(f"%{company_name}%"))

    # Employment type filter (NEW — previously unused config field)
    emp_prefs = list(config.employment_type_pref or [])
    if emp_prefs:
        stmt = stmt.where(Job.employment_type.in_(emp_prefs) | Job.employment_type.is_(None))

    # Experience level filter (NEW — previously unused config field)
    if config.experience_level:
        stmt = stmt.where(
            (Job.experience_level == config.experience_level) | Job.experience_level.is_(None)
        )

    return stmt


async def get_scoped_jobs(db: AsyncSession, config: AutoApplyConfig | None) -> list[Job]:
    """Convenience: run ``apply_config_scope`` on a plain ``select(Job)`` and return results."""
    from sqlalchemy import select

    stmt = apply_config_scope(select(Job), config)
    result = await db.execute(stmt)
    return list(result.scalars().all())
