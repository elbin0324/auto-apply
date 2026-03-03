"""Job fetch service — query-first pipeline for fetching jobs per user.

For each active user, queries the JSearch API with their criteria,
deduplicates against existing DB records, upserts new jobs, and pushes
to the score queue for heuristic scoring.
"""

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from schemas.crawl import ScoreJobsTask
from services.job_search_api import search_jobs
from services.score_queue_service import push_score_jobs_task

logger = logging.getLogger(__name__)

async def _build_queries_for_user(
    config: AutoApplyConfig,
) -> list[dict[str, Any]]:
    """Build JSearch API query params from user's AutoApplyConfig.

    Generates 1-N queries based on combinations of target titles and locations.
    Caps at a reasonable number to avoid excessive API calls.
    """
    titles = list(config.target_titles or [])
    locations = list(config.target_locations or [])
    location_prefs = list(config.location_type_pref or [])

    remote_only = location_prefs == ["remote"]

    if not titles:
        return []

    queries: list[dict[str, Any]] = []

    # If user wants remote, use each title with remote_only flag
    if remote_only:
        for title in titles[:3]:  # Cap at 3 titles
            queries.append({
                "query": title,
                "remote_only": True,
            })
    elif locations:
        # Cross-product of titles × locations, capped
        for title in titles[:3]:
            for location in locations[:2]:  # Cap at 2 locations per title
                queries.append({
                    "query": title,
                    "location": location,
                    "remote_only": False,
                })
    else:
        # No location preference — just search by title
        for title in titles[:3]:
            queries.append({
                "query": title,
                "remote_only": False,
            })

    return queries


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
            "tags": stmt.excluded.tags,
            "posted_at": stmt.excluded.posted_at,
            "is_active": stmt.excluded.is_active,
        },
    ).returning(Job.id)

    result = await db.execute(stmt)
    job_ids = [row[0] for row in result.fetchall()]
    return job_ids


async def fetch_jobs_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    config: AutoApplyConfig,
) -> dict[str, Any]:
    """Fetch jobs from JSearch API based on user config, upsert, and push to score queue.

    Returns stats: {queries_made, api_results, jobs_upserted, score_tasks_pushed}
    """
    queries = await _build_queries_for_user(config)
    if not queries:
        logger.debug("No queries to make for user %s (no target titles)", user_id)
        return {"queries_made": 0, "api_results": 0, "jobs_upserted": 0}

    all_job_rows: list[dict[str, Any]] = []
    seen_external_ids: set[str] = set()
    queries_made = 0
    total_api_results = 0

    for query_params in queries:
        results = await search_jobs(**query_params)
        queries_made += 1
        total_api_results += len(results)

        for job_row in results:
            ext_id = job_row.get("external_id")
            if ext_id and ext_id not in seen_external_ids:
                seen_external_ids.add(ext_id)
                all_job_rows.append(job_row)

    if not all_job_rows:
        logger.info("No jobs found for user %s after %d queries", user_id, queries_made)
        return {
            "queries_made": queries_made,
            "api_results": total_api_results,
            "jobs_upserted": 0,
        }

    # Upsert to DB
    job_ids = await _upsert_jobs(db, all_job_rows)
    await db.flush()

    # Push to score queue for heuristic scoring
    if job_ids:
        score_task = ScoreJobsTask(job_ids=job_ids)
        await push_score_jobs_task(score_task, source="job_fetch")

    logger.info(
        "Fetched jobs for user %s: queries=%d, api_results=%d, upserted=%d",
        user_id,
        queries_made,
        total_api_results,
        len(job_ids),
    )

    return {
        "queries_made": queries_made,
        "api_results": total_api_results,
        "jobs_upserted": len(job_ids),
    }


async def fetch_jobs_for_all_active_users(
    db: AsyncSession,
) -> dict[str, Any]:
    """Fetch jobs for all users with active AutoApplyConfig.

    Called by the arq scheduler cron task.
    """
    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.is_active.is_(True))
    )
    configs = list(result.scalars().all())

    if not configs:
        logger.debug("No active auto-apply configs, skipping fetch")
        return {"users_processed": 0, "total_jobs_upserted": 0}

    total_stats = {
        "users_processed": 0,
        "total_queries": 0,
        "total_api_results": 0,
        "total_jobs_upserted": 0,
    }

    for config in configs:
        try:
            stats = await fetch_jobs_for_user(db, config.user_id, config)
            total_stats["users_processed"] += 1
            total_stats["total_queries"] += stats.get("queries_made", 0)
            total_stats["total_api_results"] += stats.get("api_results", 0)
            total_stats["total_jobs_upserted"] += stats.get("jobs_upserted", 0)
        except Exception:
            logger.exception("Job fetch failed for user %s", config.user_id)

    await db.commit()

    logger.info("Job fetch for all users complete: %s", total_stats)
    return total_stats
