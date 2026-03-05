"""Redis queue consumer for job enrichment tasks (enrich:jobs).

Push functions have been moved to ``infra.task_queue``.
This module retains only the consumer (pop) and depth-check functions.
"""

from infra.redis_pool import get_redis
from schemas.enrichment import EnrichJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.queues import pop_task

ENRICH_QUEUE_KEY = "enrich:jobs"


async def pop_enrich_task() -> tuple[TaskEnvelope, EnrichJobsTask] | None:
    """Pop one enrich task (blocking with 5s timeout)."""
    return await pop_task(ENRICH_QUEUE_KEY, EnrichJobsTask)


async def get_enrich_queue_depth() -> int:
    """Return the number of tasks in the enrich queue."""
    redis = get_redis()
    return await redis.llen(ENRICH_QUEUE_KEY)
