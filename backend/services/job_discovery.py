import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from models.company import Company
from models.job import Job
from services.crawlers import CRAWLER_REGISTRY
from services.crawlers.base import CrawlResult, RawJobListing

logger = logging.getLogger(__name__)

STALE_DAYS = 30
DEFAULT_CONCURRENCY = 5


async def get_active_companies(
    db: AsyncSession,
    ats_types: list[str] | None = None,
) -> list[Company]:
    """Fetch active companies, optionally filtered by ATS type."""
    stmt = select(Company).where(Company.is_active.is_(True))
    if ats_types:
        stmt = stmt.where(Company.ats_type.in_(ats_types))
    stmt = stmt.order_by(Company.slug)
    result = await db.execute(stmt)
    return list(result.scalars().all())


def _listing_to_job_row(
    listing: RawJobListing, company_id: Any
) -> dict[str, Any]:
    """Convert a RawJobListing to a dict for DB upsert."""
    return {
        "external_id": listing.external_id,
        "title": listing.title,
        "company": listing.company_name,
        "company_id": company_id,
        "location": listing.location,
        "location_type": listing.location_type,
        "salary_min": listing.salary_min,
        "salary_max": listing.salary_max,
        "salary_currency": listing.salary_currency,
        "description": listing.description,
        "url": listing.url,
        "apply_url": listing.apply_url,
        "source": listing.external_id.split(":")[0] if ":" in listing.external_id else "unknown",
        "category": listing.department,
        "tags": listing.tags,
        "is_active": True,
        "posted_at": listing.posted_at,
    }


async def upsert_crawled_jobs(
    db: AsyncSession, job_rows: list[dict[str, Any]]
) -> int:
    """Upsert crawled jobs using external_id as conflict key."""
    if not job_rows:
        return 0

    stmt = pg_insert(Job).values(job_rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["external_id"],
        set_={
            "title": stmt.excluded.title,
            "company": stmt.excluded.company,
            "company_id": stmt.excluded.company_id,
            "location": stmt.excluded.location,
            "location_type": stmt.excluded.location_type,
            "salary_min": stmt.excluded.salary_min,
            "salary_max": stmt.excluded.salary_max,
            "salary_currency": stmt.excluded.salary_currency,
            "description": stmt.excluded.description,
            "url": stmt.excluded.url,
            "apply_url": stmt.excluded.apply_url,
            "category": stmt.excluded.category,
            "tags": stmt.excluded.tags,
            "is_active": stmt.excluded.is_active,
        },
    )
    await db.execute(stmt)
    return len(job_rows)


async def deactivate_missing_jobs(
    db: AsyncSession,
    company_id: Any,
    seen_external_ids: list[str],
) -> int:
    """Deactivate jobs for a company that weren't found in the latest crawl."""
    if not seen_external_ids:
        return 0

    stmt = (
        update(Job)
        .where(
            Job.company_id == company_id,
            Job.is_active.is_(True),
            Job.external_id.notin_(seen_external_ids),
        )
        .values(is_active=False)
    )
    result = await db.execute(stmt)
    return result.rowcount


async def crawl_company(db: AsyncSession, company: Company) -> CrawlResult:
    """Crawl a single company, upsert jobs, deactivate missing ones."""
    crawler_cls = CRAWLER_REGISTRY.get(company.ats_type)
    if not crawler_cls:
        return CrawlResult(
            company_slug=company.slug,
            ats_type=company.ats_type,
            error=f"Unknown ATS type: {company.ats_type}",
        )

    crawler = crawler_cls()

    try:
        listings = await crawler.fetch_jobs(company)
    except Exception as e:
        logger.error("Crawl failed for %s: %s", company.slug, e, exc_info=True)
        return CrawlResult(
            company_slug=company.slug,
            ats_type=company.ats_type,
            error=str(e),
        )

    # Convert to DB rows and upsert
    job_rows = [_listing_to_job_row(listing, company.id) for listing in listings]
    upserted = await upsert_crawled_jobs(db, job_rows)

    # Deactivate jobs not seen in this crawl
    seen_ids = [listing.external_id for listing in listings]
    deactivated = await deactivate_missing_jobs(db, company.id, seen_ids)

    # Update company metadata
    company.last_crawled_at = datetime.now(timezone.utc)
    company.job_count = len(listings)

    logger.info(
        "Crawl %s (%s): %d found, %d upserted, %d deactivated",
        company.slug,
        company.ats_type,
        len(listings),
        upserted,
        deactivated,
    )

    return CrawlResult(
        company_slug=company.slug,
        ats_type=company.ats_type,
        jobs_found=len(listings),
        jobs_upserted=upserted,
        jobs_deactivated=deactivated,
    )


async def run_discovery(
    db: AsyncSession,
    ats_types: list[str] | None = None,
    company_slugs: list[str] | None = None,
    concurrency: int = DEFAULT_CONCURRENCY,
) -> dict[str, Any]:
    """Crawl companies and upsert their jobs.

    Args:
        db: Database session
        ats_types: Optional filter by ATS platform types
        company_slugs: Optional filter by specific company slugs
        concurrency: Max companies to crawl concurrently

    Returns:
        Aggregate stats from all crawls
    """
    # Build query
    stmt = select(Company).where(Company.is_active.is_(True))
    if ats_types:
        stmt = stmt.where(Company.ats_type.in_(ats_types))
    if company_slugs:
        stmt = stmt.where(Company.slug.in_(company_slugs))
    stmt = stmt.order_by(Company.slug)

    result = await db.execute(stmt)
    companies = list(result.scalars().all())

    if not companies:
        return {
            "companies_crawled": 0,
            "total_jobs_found": 0,
            "total_jobs_upserted": 0,
            "total_jobs_deactivated": 0,
            "errors": [],
        }

    # Crawl with concurrency limit using semaphore
    semaphore = asyncio.Semaphore(concurrency)
    results: list[CrawlResult] = []

    async def _crawl_with_limit(company: Company) -> CrawlResult:
        async with semaphore:
            return await crawl_company(db, company)

    tasks = [_crawl_with_limit(c) for c in companies]
    results = await asyncio.gather(*tasks)

    # Flush all changes
    await db.flush()

    # Aggregate stats
    errors = [
        {"company": r.company_slug, "error": r.error}
        for r in results
        if r.error
    ]

    return {
        "companies_crawled": len(companies),
        "total_jobs_found": sum(r.jobs_found for r in results),
        "total_jobs_upserted": sum(r.jobs_upserted for r in results),
        "total_jobs_deactivated": sum(r.jobs_deactivated for r in results),
        "errors": errors,
        "results": [r.model_dump() for r in results],
    }
