"""Redis queue service for job enrichment tasks (enrich:jobs)."""

import json
import logging

from schemas.enrichment import EnrichJobsTask
from schemas.task_envelope import TaskEnvelope
from services.redis_pool import get_redis

logger = logging.getLogger(__name__)

ENRICH_QUEUE_KEY = "enrich:jobs"


async def push_enrich_task(task: EnrichJobsTask, source: str = "scheduler") -> None:
    """Push a batch of job IDs for LLM enrichment."""
    redis = get_redis()
    envelope = TaskEnvelope(
        source_worker=source,
        queue_name=ENRICH_QUEUE_KEY,
        payload=task.model_dump_json(),
    )
    await redis.rpush(ENRICH_QUEUE_KEY, envelope.model_dump_json())
    logger.info(
        "Pushed enrich:jobs task for company %s (%d jobs, task_id=%s)",
        task.company_id,
        len(task.job_ids),
        envelope.task_id,
    )


async def pop_enrich_task() -> tuple[TaskEnvelope, EnrichJobsTask] | None:
    """Pop one enrich task (blocking with 5s timeout)."""
    redis = get_redis()
    result = await redis.blpop(ENRICH_QUEUE_KEY, timeout=5)
    if result is None:
        return None
    _, raw = result
    data = json.loads(raw)
    if "task_id" in data and "payload" in data:
        envelope = TaskEnvelope.model_validate(data)
        task = EnrichJobsTask.model_validate_json(envelope.payload)
    else:
        task = EnrichJobsTask.model_validate(data)
        envelope = TaskEnvelope(
            source_worker="unknown",
            queue_name=ENRICH_QUEUE_KEY,
            payload=task.model_dump_json(),
        )
    return envelope, task


async def get_enrich_queue_depth() -> int:
    """Return the number of tasks in the enrich queue."""
    redis = get_redis()
    return await redis.llen(ENRICH_QUEUE_KEY)
