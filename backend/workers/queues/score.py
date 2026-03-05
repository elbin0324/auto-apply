"""Redis queue consumer for scoring tasks (score:jobs).

Push functions have been moved to ``infra.task_queue``.
This module retains only the consumer (pop) and depth-check functions.
"""

from infra.redis_pool import get_redis
from schemas.queue_tasks import ScoreJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.queues import pop_task

SCORE_JOBS_QUEUE_KEY = "score:jobs"


async def pop_score_jobs_task() -> tuple[TaskEnvelope, ScoreJobsTask] | None:
    """Pop one score:jobs task (blocking with 5s timeout)."""
    return await pop_task(SCORE_JOBS_QUEUE_KEY, ScoreJobsTask)


async def get_score_queue_depth() -> int:
    """Return depth of the score:jobs queue."""
    redis = get_redis()
    return await redis.llen(SCORE_JOBS_QUEUE_KEY)
