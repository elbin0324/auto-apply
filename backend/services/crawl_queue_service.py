"""Redis queue service for crawl tasks.

Uses SET NX with TTL for deduplication — if a company is already enqueued
or was recently crawled, push_crawl_task is a no-op.
"""

import json
import logging

from config import get_settings
from schemas.crawl import CrawlTask
from schemas.task_envelope import TaskEnvelope
from services.redis_pool import get_redis

logger = logging.getLogger(__name__)

CRAWL_QUEUE_KEY = "crawl:companies"


async def push_crawl_task(task: CrawlTask, source: str = "scheduler") -> bool:
    """Push a company to the crawl queue with deduplication.

    Returns True if enqueued, False if already pending.
    """
    redis = get_redis()
    settings = get_settings()
    dedup_key = f"crawl:dedup:{task.company_id}"
    # SET NX with TTL = stale_hours — prevents re-enqueue while pending
    was_set = await redis.set(dedup_key, "1", nx=True, ex=settings.crawl_stale_hours * 3600)
    if not was_set:
        logger.debug("Crawl task for %s already pending, skipping", task.company_slug)
        return False
    envelope = TaskEnvelope(
        source_worker=source,
        queue_name=CRAWL_QUEUE_KEY,
        payload=task.model_dump_json(),
    )
    await redis.rpush(CRAWL_QUEUE_KEY, envelope.model_dump_json())
    logger.info("Pushed crawl task for %s (task_id=%s)", task.company_slug, envelope.task_id)
    return True


async def pop_crawl_task() -> tuple[TaskEnvelope, CrawlTask] | None:
    """Pop one crawl task (blocking with 5s timeout).

    Returns (envelope, task) tuple or None if queue is empty.
    """
    redis = get_redis()
    result = await redis.blpop(CRAWL_QUEUE_KEY, timeout=5)
    if result is None:
        return None
    _, raw = result
    return _parse_message(raw)


def _parse_message(raw: str) -> tuple[TaskEnvelope, CrawlTask]:
    """Parse a queue message, handling both envelope and legacy formats."""
    data = json.loads(raw)
    if "task_id" in data and "payload" in data:
        envelope = TaskEnvelope.model_validate(data)
        task = CrawlTask.model_validate_json(envelope.payload)
    else:
        # Legacy format: raw CrawlTask without envelope
        task = CrawlTask.model_validate(data)
        envelope = TaskEnvelope(
            source_worker="unknown",
            queue_name=CRAWL_QUEUE_KEY,
            payload=task.model_dump_json(),
        )
    return envelope, task


async def clear_crawl_dedup(company_id: str) -> None:
    """Clear dedup key after crawl completes, allowing re-enqueue on next cycle."""
    redis = get_redis()
    await redis.delete(f"crawl:dedup:{company_id}")


async def get_crawl_queue_depth() -> int:
    """Return the number of tasks in the crawl queue."""
    redis = get_redis()
    return await redis.llen(CRAWL_QUEUE_KEY)


async def count_crawl_dedup_keys() -> int:
    """Count active crawl dedup keys using SCAN (non-blocking)."""
    redis = get_redis()
    count = 0
    async for _ in redis.scan_iter(match="crawl:dedup:*", count=100):
        count += 1
    return count
