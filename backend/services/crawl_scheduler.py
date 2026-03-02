"""Crawl scheduler — determines which companies need crawling and enqueues tasks.

Called periodically by the arq cron worker. Queries companies by staleness
and pushes CrawlTask messages to the crawl:companies Redis queue.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.company import Company
from schemas.crawl import CrawlTask
from services.crawl_queue_service import push_crawl_task

logger = logging.getLogger(__name__)


async def get_stale_companies(
    db: AsyncSession,
    stale_hours: int,
) -> list[Company]:
    """Fetch active companies that need crawling, ordered by staleness.

    Priority order:
    1. Never crawled (last_crawled_at IS NULL) — highest priority
    2. Oldest last_crawled_at first
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=stale_hours)

    stmt = (
        select(Company)
        .where(
            Company.is_active.is_(True),
            or_(
                Company.last_crawled_at.is_(None),
                Company.last_crawled_at < cutoff,
            ),
        )
        .order_by(Company.last_crawled_at.asc().nulls_first())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def enqueue_stale_companies(db: AsyncSession) -> dict:
    """Find stale companies and push them to the crawl queue.

    Returns stats about how many were enqueued vs skipped.
    """
    settings = get_settings()
    companies = await get_stale_companies(db, settings.crawl_stale_hours)

    enqueued = 0
    skipped = 0

    for company in companies:
        task = CrawlTask(
            company_id=company.id,
            company_slug=company.slug,
            ats_type=company.ats_type,
            priority=1 if company.last_crawled_at is None else 0,
        )
        was_enqueued = await push_crawl_task(task)
        if was_enqueued:
            enqueued += 1
        else:
            skipped += 1

    logger.info(
        "Crawl scheduler: %d stale companies found, %d enqueued, %d already in queue",
        len(companies),
        enqueued,
        skipped,
    )
    return {
        "stale_companies": len(companies),
        "enqueued": enqueued,
        "skipped_already_enqueued": skipped,
    }
