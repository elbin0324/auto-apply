"""Redis queue service for job enrichment tasks (enrich:jobs)."""

import logging

from redis.asyncio import Redis

from config import get_settings
from schemas.enrichment import EnrichJobsTask

logger = logging.getLogger(__name__)

ENRICH_QUEUE_KEY = "enrich:jobs"


async def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


async def push_enrich_task(task: EnrichJobsTask) -> None:
    """Push a batch of job IDs for LLM enrichment."""
    redis = await get_redis()
    try:
        await redis.rpush(ENRICH_QUEUE_KEY, task.model_dump_json())
        logger.info(
            "Pushed enrich:jobs task for company %s (%d jobs)",
            task.company_id,
            len(task.job_ids),
        )
    finally:
        await redis.aclose()


async def pop_enrich_task() -> EnrichJobsTask | None:
    """Pop one enrich task (blocking with 5s timeout)."""
    redis = await get_redis()
    try:
        result = await redis.blpop(ENRICH_QUEUE_KEY, timeout=5)
        if result is None:
            return None
        _, payload = result
        return EnrichJobsTask.model_validate_json(payload)
    finally:
        await redis.aclose()


async def get_enrich_queue_depth() -> int:
    """Return the number of tasks in the enrich queue."""
    redis = await get_redis()
    try:
        return await redis.llen(ENRICH_QUEUE_KEY)
    finally:
        await redis.aclose()
