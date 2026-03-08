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
    EMPLOYMENT_TYPE_MAP,
    EXPERIENCE_LEVEL_MAP,
    WORK_ARRANGEMENT_MAP,
    JobSearchParams,
    build_advanced_title_query,
    normalize_taxonomies,
)
from workers.services.location_normalizer import normalize_locations

logger = logging.getLogger(__name__)


def _build_search_params(
    config: AutoApplyConfig,
) -> list[JobSearchParams]:
    """Build a single JobSearchParams from user's AutoApplyConfig.

    All titles are combined into one ``advanced_title_filter`` query using
    OR logic, so only one API call is needed instead of N.

    Returns an empty list if no target_titles are configured.
    Returns a list with exactly one JobSearchParams otherwise.
    """
    titles = list(config.target_titles or [])
    if not titles:
        return []

    locations = list(config.target_locations or [])
    location_prefs = list(config.location_type_pref or [])

    # Build advanced title query — combines all titles into one OR query
    advanced_title_filter = build_advanced_title_query(titles)

    # Location filter — normalize abbreviations/aliases before sending
    location_filter: str | None = None
    if locations:
        normalized = normalize_locations(locations)
        if normalized:
            location_filter = " OR ".join(normalized)

    # Work arrangement filter — only use ai_work_arrangement_filter (no remote=True)
    ai_work_arrangement_filter: str | None = None
    if location_prefs:
        arrangement_parts: list[str] = []
        for pref in location_prefs:
            mapped = WORK_ARRANGEMENT_MAP.get(pref)
            if mapped:
                arrangement_parts.append(mapped)
        if arrangement_parts:
            ai_work_arrangement_filter = ",".join(arrangement_parts)

    ai_experience_level_filter: str | None = None
    if config.experience_level:
        api_level = EXPERIENCE_LEVEL_MAP.get(config.experience_level)
        if api_level:
            ai_experience_level_filter = api_level

    organization_exclusion_filter: str | None = None
    excluded = list(config.excluded_companies or [])
    if excluded:
        organization_exclusion_filter = ",".join(excluded)

    # Industry taxonomy — normalize user values to API taxonomy
    ai_taxonomies_a_filter: str | None = None
    industries = list(config.preferred_industries or [])
    if industries:
        normalized_industries = normalize_taxonomies(industries)
        if normalized_industries:
            formatted = []
            for ind in normalized_industries:
                if "&" in ind:
                    formatted.append(f'"{ind}"')
                else:
                    formatted.append(ind)
            ai_taxonomies_a_filter = ",".join(formatted)

    # Employment type filter
    ai_employment_type_filter: str | None = None
    employment_prefs = list(getattr(config, "employment_type_pref", None) or [])
    if employment_prefs:
        emp_parts: list[str] = []
        for pref in employment_prefs:
            mapped = EMPLOYMENT_TYPE_MAP.get(pref)
            if mapped:
                emp_parts.append(mapped)
        if emp_parts:
            ai_employment_type_filter = ",".join(emp_parts)

    return [
        JobSearchParams(
            advanced_title_filter=advanced_title_filter,
            location_filter=location_filter,
            remote=None,  # never set remote=True, use ai_work_arrangement_filter only
            ai_work_arrangement_filter=ai_work_arrangement_filter,
            ai_employment_type_filter=ai_employment_type_filter,
            ai_experience_level_filter=ai_experience_level_filter,
            organization_exclusion_filter=organization_exclusion_filter,
            ai_taxonomies_a_filter=ai_taxonomies_a_filter,
            include_ai=True,
            agency=False,
        )
    ]


def _build_relaxed_params(
    base: JobSearchParams,
) -> list[JobSearchParams]:
    """Build progressively relaxed versions of search params.

    Returns a list of JobSearchParams with filters dropped in order:
    1. Drop ai_taxonomies_a_filter (industry)
    2. Drop ai_experience_level_filter (experience)
    3. Drop ai_work_arrangement_filter + location_filter (location constraints)

    Each level includes all previous relaxations. The caller should try
    each in order, stopping as soon as results are found.
    """
    from dataclasses import replace

    levels: list[JobSearchParams] = []

    # Level 1: drop industry
    level1 = replace(base, ai_taxonomies_a_filter=None)
    if level1 != base:
        levels.append(level1)

    # Level 2: also drop experience
    level2 = replace(level1, ai_experience_level_filter=None)
    if level2 != level1:
        levels.append(level2)

    # Level 3: also drop location constraints
    level3 = replace(level2, ai_work_arrangement_filter=None, location_filter=None)
    if level3 != level2:
        levels.append(level3)

    return levels


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
            "ats_platform": stmt.excluded.ats_platform,
            "posted_at": stmt.excluded.posted_at,
            "is_active": stmt.excluded.is_active,
        },
    ).returning(Job.id)

    result = await db.execute(stmt)
    job_ids = [row[0] for row in result.fetchall()]
    return job_ids
