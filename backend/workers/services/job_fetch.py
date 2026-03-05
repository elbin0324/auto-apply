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
) -> JobSearchParams | None:
    """Build a single JobSearchParams from user's AutoApplyConfig.

    Combines all target titles into one advanced_title_filter (Lucene OR),
    all locations into one location_filter, and maps all preference fields
    to their corresponding API filter params.

    Returns None if no target_titles are configured.
    """
    titles = list(config.target_titles or [])
    if not titles:
        return None

    locations = list(config.target_locations or [])
    location_prefs = list(config.location_type_pref or [])

    params = JobSearchParams(
        include_ai=True,
        agency=False,
    )

    # Combine titles with Lucene OR: 'Title A' | 'Title B'
    params.advanced_title_filter = " | ".join(f"'{t}'" for t in titles)

    # Combine locations: "City A" OR "City B"
    if locations:
        params.location_filter = " OR ".join(f'"{loc}"' for loc in locations)

    # Work arrangement / remote preference
    if location_prefs:
        arrangement_parts: list[str] = []
        for pref in location_prefs:
            mapped = WORK_ARRANGEMENT_MAP.get(pref)
            if mapped:
                arrangement_parts.append(mapped)
        if arrangement_parts:
            params.ai_work_arrangement_filter = ",".join(arrangement_parts)

        # Also set the remote boolean for exclusive remote preference
        if location_prefs == ["remote"]:
            params.remote = True

    # Experience level
    if config.experience_level:
        api_level = EXPERIENCE_LEVEL_MAP.get(config.experience_level)
        if api_level:
            params.ai_experience_level_filter = api_level

    # Excluded companies (exact match, comma-delimited without spaces)
    excluded = list(config.excluded_companies or [])
    if excluded:
        params.organization_exclusion_filter = ",".join(excluded)

    # Preferred industries → ai_taxonomies_a_filter
    # Double-quote any containing '&' per API docs
    industries = list(config.preferred_industries or [])
    if industries:
        formatted = []
        for ind in industries:
            if "&" in ind:
                formatted.append(f'"{ind}"')
            else:
                formatted.append(ind)
        params.ai_taxonomies_a_filter = ",".join(formatted)

    return params


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
