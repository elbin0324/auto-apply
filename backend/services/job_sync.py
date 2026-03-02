import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.job import Job

logger = logging.getLogger(__name__)

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
RESULTS_PER_PAGE = 50
STALE_DAYS = 30


async def fetch_adzuna_page(
    client: httpx.AsyncClient,
    app_id: str,
    app_key: str,
    page: int,
    country: str = "ca",
    category: str = "it-jobs",
) -> list[dict[str, Any]]:
    url = f"{ADZUNA_BASE_URL}/{country}/search/{page}"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": RESULTS_PER_PAGE,
        "category": category,
        "sort_by": "date",
        "content-type": "application/json",
    }
    response = await client.get(url, params=params, timeout=30.0)
    response.raise_for_status()
    data = response.json()
    return data.get("results", [])


def _parse_adzuna_result(result: dict[str, Any]) -> dict[str, Any]:
    posted_at: datetime | None = None
    posted_at_str = result.get("created")
    if posted_at_str:
        try:
            posted_at = datetime.fromisoformat(posted_at_str.replace("Z", "+00:00"))
        except ValueError:
            pass

    category_data = result.get("category", {})
    location_data = result.get("location", {})
    company_data = result.get("company", {})

    return {
        "external_id": str(result["id"]),
        "title": result.get("title", ""),
        "company": company_data.get("display_name"),
        "location": location_data.get("display_name"),
        "description": result.get("description"),
        "url": result.get("redirect_url", ""),
        "salary_min": result.get("salary_min"),
        "salary_max": result.get("salary_max"),
        "salary_currency": "CAD",
        "category": category_data.get("label"),
        "tags": [category_data.get("tag")] if category_data.get("tag") else [],
        "source": "adzuna",
        "is_active": True,
        "posted_at": posted_at,
    }


async def upsert_jobs(db: AsyncSession, job_rows: list[dict[str, Any]]) -> list[str]:
    if not job_rows:
        return []

    stmt = pg_insert(Job).values(job_rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["external_id"],
        set_={
            "title": stmt.excluded.title,
            "company": stmt.excluded.company,
            "location": stmt.excluded.location,
            "description": stmt.excluded.description,
            "url": stmt.excluded.url,
            "salary_min": stmt.excluded.salary_min,
            "salary_max": stmt.excluded.salary_max,
            "category": stmt.excluded.category,
            "tags": stmt.excluded.tags,
            "posted_at": stmt.excluded.posted_at,
            "is_active": stmt.excluded.is_active,
        },
    )
    await db.execute(stmt)

    return [row["external_id"] for row in job_rows]


async def deactivate_stale_jobs(db: AsyncSession, seen_external_ids: list[str]) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=STALE_DAYS)

    stmt = (
        update(Job)
        .where(
            Job.is_active.is_(True),
            Job.posted_at < cutoff,
            Job.external_id.notin_(seen_external_ids) if seen_external_ids else True,
        )
        .values(is_active=False)
    )
    result = await db.execute(stmt)
    count = result.rowcount
    if count:
        logger.info("Deactivated %d stale jobs", count)
    return count


async def run_sync(db: AsyncSession) -> dict[str, Any]:
    settings = get_settings()
    all_external_ids: list[str] = []
    total_fetched = 0

    country = settings.adzuna_sync_country
    categories = [
        c.strip() for c in settings.adzuna_sync_categories.split(",") if c.strip()
    ]
    pages = settings.adzuna_sync_pages

    async with httpx.AsyncClient() as client:
        for category in categories:
            for page in range(1, pages + 1):
                try:
                    results = await fetch_adzuna_page(
                        client,
                        settings.adzuna_app_id,
                        settings.adzuna_api_key,
                        page,
                        country=country,
                        category=category,
                    )
                except httpx.HTTPStatusError as e:
                    logger.error(
                        "Adzuna %s page %d failed: %s", category, page, e
                    )
                    break
                except httpx.TimeoutException:
                    logger.error("Adzuna %s page %d timed out", category, page)
                    break

                if not results:
                    logger.info(
                        "Adzuna %s page %d empty, stopping", category, page
                    )
                    break

                job_rows = [_parse_adzuna_result(r) for r in results]
                job_rows = [r for r in job_rows if r.get("url")]
                upserted_ids = await upsert_jobs(db, job_rows)
                all_external_ids.extend(upserted_ids)
                total_fetched += len(results)
                logger.info(
                    "Synced %s page %d: %d jobs", category, page, len(results)
                )

    deactivated = await deactivate_stale_jobs(db, all_external_ids)

    return {
        "jobs_fetched": total_fetched,
        "jobs_upserted": len(all_external_ids),
        "jobs_deactivated": deactivated,
        "synced_external_ids": all_external_ids,
    }
