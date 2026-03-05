"""Job fetch service — query-first pipeline for fetching jobs per user.

For each active user, builds a single Active Jobs DB query from their
AutoApplyConfig, deduplicates against existing DB records, upserts new
jobs, and pushes to the score queue for heuristic scoring.
"""

import logging
import uuid
from typing import Any

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from workers.services.job_search_api import (
    EXPERIENCE_LEVEL_MAP,
    WORK_ARRANGEMENT_MAP,
    JobSearchParams,
)

logger = logging.getLogger(__name__)


def _build_search_params(
    config: AutoApplyConfig,
) -> list[JobSearchParams]:
    """Build one JobSearchParams per target title from user's AutoApplyConfig.

    The title_filter API param only accepts a single title, so we create
    a separate query for each title. All other filters (location, experience,
    etc.) are shared across queries.

    Returns an empty list if no target_titles are configured.
    """
    titles = list(config.target_titles or [])
    if not titles:
        return []

    locations = list(config.target_locations or [])
    location_prefs = list(config.location_type_pref or [])

    # Build shared filter values
    location_filter: str | None = None
    if locations:
        location_filter = " OR ".join(locations)

    ai_work_arrangement_filter: str | None = None
    remote: bool | None = None
    if location_prefs:
        arrangement_parts: list[str] = []
        for pref in location_prefs:
            mapped = WORK_ARRANGEMENT_MAP.get(pref)
            if mapped:
                arrangement_parts.append(mapped)
        if arrangement_parts:
            ai_work_arrangement_filter = ",".join(arrangement_parts)
        if location_prefs == ["remote"]:
            remote = True

    ai_experience_level_filter: str | None = None
    if config.experience_level:
        api_level = EXPERIENCE_LEVEL_MAP.get(config.experience_level)
        if api_level:
            ai_experience_level_filter = api_level

    organization_exclusion_filter: str | None = None
    excluded = list(config.excluded_companies or [])
    if excluded:
        organization_exclusion_filter = ",".join(excluded)

    ai_taxonomies_a_filter: str | None = None
    industries = list(config.preferred_industries or [])
    if industries:
        formatted = []
        for ind in industries:
            if "&" in ind:
                formatted.append(f'"{ind}"')
            else:
                formatted.append(ind)
        ai_taxonomies_a_filter = ",".join(formatted)

    # One query per title
    return [
        JobSearchParams(
            title_filter=title,
            location_filter=location_filter,
            remote=remote,
            ai_work_arrangement_filter=ai_work_arrangement_filter,
            ai_experience_level_filter=ai_experience_level_filter,
            organization_exclusion_filter=organization_exclusion_filter,
            ai_taxonomies_a_filter=ai_taxonomies_a_filter,
            include_ai=True,
            agency=False,
        )
        for title in titles
    ]


async def _upsert_jobs(
    db: AsyncSession,
    job_rows: list[dict[str, Any]],
) -> list[uuid.UUID]:
    """Upsert jobs to DB and return list of job IDs (both new and existing).

    Uses external_id for conflict detection.
    """
    if not job_rows:
        return []

    stmt = pg_insert(Job).values(job_rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["external_id"],
        set_={
            "title": stmt.excluded.title,
            "company": stmt.excluded.company,
            "company_logo_url": stmt.excluded.company_logo_url,
            "location": stmt.excluded.location,
            "location_type": stmt.excluded.location_type,
            "description": stmt.excluded.description,
            "url": stmt.excluded.url,
            "apply_url": stmt.excluded.apply_url,
            "salary_min": stmt.excluded.salary_min,
            "salary_max": stmt.excluded.salary_max,
            "salary_currency": stmt.excluded.salary_currency,
            "category": stmt.excluded.category,
            "employment_type": stmt.excluded.employment_type,
            "experience_level": stmt.excluded.experience_level,
            "tags": stmt.excluded.tags,
            "posted_at": stmt.excluded.posted_at,
            "is_active": stmt.excluded.is_active,
        },
    ).returning(Job.id)

    result = await db.execute(stmt)
    job_ids = [row[0] for row in result.fetchall()]
    return job_ids
