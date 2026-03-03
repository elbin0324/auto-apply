"""Redis queue service for scoring tasks (score:jobs)."""

import json
import logging

from schemas.crawl import ScoreJobsTask
from schemas.task_envelope import TaskEnvelope
from services.redis_pool import get_redis

logger = logging.getLogger(__name__)

SCORE_JOBS_QUEUE_KEY = "score:jobs"


async def push_score_jobs_task(task: ScoreJobsTask, source: str = "job_fetch") -> None:
    """Push a batch of job IDs for heuristic scoring."""
    redis = get_redis()
    envelope = TaskEnvelope(
        source_worker=source,
        queue_name=SCORE_JOBS_QUEUE_KEY,
        payload=task.model_dump_json(),
    )
    await redis.rpush(SCORE_JOBS_QUEUE_KEY, envelope.model_dump_json())
    logger.info(
        "Pushed score:jobs task (%d jobs, source=%s, task_id=%s)",
        len(task.job_ids),
        source,
        envelope.task_id,
    )


async def pop_score_jobs_task() -> tuple[TaskEnvelope, ScoreJobsTask] | None:
    """Pop one score:jobs task (blocking with 5s timeout)."""
    redis = get_redis()
    result = await redis.blpop(SCORE_JOBS_QUEUE_KEY, timeout=5)
    if result is None:
        return None
    _, raw = result
    data = json.loads(raw)
    if "task_id" in data and "payload" in data:
        envelope = TaskEnvelope.model_validate(data)
        task = ScoreJobsTask.model_validate_json(envelope.payload)
    else:
        task = ScoreJobsTask.model_validate(data)
        envelope = TaskEnvelope(
            source_worker="unknown",
            queue_name=SCORE_JOBS_QUEUE_KEY,
            payload=task.model_dump_json(),
        )
    return envelope, task


async def get_score_queue_depth() -> int:
    """Return depth of the score:jobs queue."""
    redis = get_redis()
    return await redis.llen(SCORE_JOBS_QUEUE_KEY)
