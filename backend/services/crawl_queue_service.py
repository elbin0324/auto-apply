"""Redis queue service for crawl tasks.

Uses SET NX with TTL for deduplication — if a company is already enqueued
or was recently crawled, push_crawl_task is a no-op.
"""

import logging

from redis.asyncio import Redis

from config import get_settings
from schemas.crawl import CrawlTask

logger = logging.getLogger(__name__)

CRAWL_QUEUE_KEY = "crawl:companies"


async def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


async def push_crawl_task(task: CrawlTask) -> bool:
    """Push a company to the crawl queue with deduplication.

    Returns True if enqueued, False if already pending.
    """
    redis = await get_redis()
    try:
        settings = get_settings()
        dedup_key = f"crawl:dedup:{task.company_id}"
        # SET NX with TTL = stale_hours — prevents re-enqueue while pending
        was_set = await redis.set(dedup_key, "1", nx=True, ex=settings.crawl_stale_hours * 3600)
        if not was_set:
            logger.debug("Crawl task for %s already pending, skipping", task.company_slug)
            return False
        await redis.rpush(CRAWL_QUEUE_KEY, task.model_dump_json())
        logger.info("Pushed crawl task for %s", task.company_slug)
        return True
    finally:
        await redis.aclose()


async def pop_crawl_task() -> CrawlTask | None:
    """Pop one crawl task (blocking with 5s timeout).

    Returns None if queue is empty after timeout.
    """
    redis = await get_redis()
    try:
        result = await redis.blpop(CRAWL_QUEUE_KEY, timeout=5)
        if result is None:
            return None
        _, payload = result
        return CrawlTask.model_validate_json(payload)
    finally:
        await redis.aclose()


async def clear_crawl_dedup(company_id: str) -> None:
    """Clear dedup key after crawl completes, allowing re-enqueue on next cycle."""
    redis = await get_redis()
    try:
        await redis.delete(f"crawl:dedup:{company_id}")
    finally:
        await redis.aclose()


async def get_crawl_queue_depth() -> int:
    """Return the number of tasks in the crawl queue."""
    redis = await get_redis()
    try:
        return await redis.llen(CRAWL_QUEUE_KEY)
    finally:
        await redis.aclose()


async def count_crawl_dedup_keys() -> int:
    """Count active crawl dedup keys using SCAN (non-blocking)."""
    redis = await get_redis()
    try:
        count = 0
        async for _ in redis.scan_iter(match="crawl:dedup:*", count=100):
            count += 1
        return count
    finally:
        await redis.aclose()
