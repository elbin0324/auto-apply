"""Redis queue service for scoring tasks (score:jobs and score:users)."""

import json
import logging

from schemas.crawl import ScoreJobsTask, ScoreUserTask
from schemas.task_envelope import TaskEnvelope
from services.redis_pool import get_redis

logger = logging.getLogger(__name__)

SCORE_JOBS_QUEUE_KEY = "score:jobs"
SCORE_USERS_QUEUE_KEY = "score:users"


# ── score:jobs queue ──────────────────────────────────────────────────────────


async def push_score_jobs_task(task: ScoreJobsTask, source: str = "crawl") -> None:
    """Push a batch of job IDs for scoring after a crawl."""
    redis = get_redis()
    envelope = TaskEnvelope(
        source_worker=source,
        queue_name=SCORE_JOBS_QUEUE_KEY,
        payload=task.model_dump_json(),
    )
    await redis.rpush(SCORE_JOBS_QUEUE_KEY, envelope.model_dump_json())
    logger.info(
        "Pushed score:jobs task for company %s (%d jobs, task_id=%s)",
        task.company_id,
        len(task.job_ids),
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


# ── score:users queue ─────────────────────────────────────────────────────────


async def push_score_user_task(task: ScoreUserTask, source: str = "scheduler") -> None:
    """Push a user for re-scoring with 5-minute deduplication."""
    redis = get_redis()
    dedup_key = f"score:user:dedup:{task.user_id}"
    was_set = await redis.set(dedup_key, "1", nx=True, ex=300)  # 5-min dedup
    if not was_set:
        logger.debug("Score task for user %s already pending", task.user_id)
        return
    envelope = TaskEnvelope(
        source_worker=source,
        queue_name=SCORE_USERS_QUEUE_KEY,
        payload=task.model_dump_json(),
    )
    await redis.rpush(SCORE_USERS_QUEUE_KEY, envelope.model_dump_json())
    logger.info(
        "Pushed score:users task for user %s (%s, task_id=%s)",
        task.user_id,
        task.reason,
        envelope.task_id,
    )


async def pop_score_user_task() -> tuple[TaskEnvelope, ScoreUserTask] | None:
    """Pop one score:users task (blocking with 5s timeout)."""
    redis = get_redis()
    result = await redis.blpop(SCORE_USERS_QUEUE_KEY, timeout=5)
    if result is None:
        return None
    _, raw = result
    data = json.loads(raw)
    if "task_id" in data and "payload" in data:
        envelope = TaskEnvelope.model_validate(data)
        task = ScoreUserTask.model_validate_json(envelope.payload)
    else:
        task = ScoreUserTask.model_validate(data)
        envelope = TaskEnvelope(
            source_worker="unknown",
            queue_name=SCORE_USERS_QUEUE_KEY,
            payload=task.model_dump_json(),
        )
    return envelope, task


# ── monitoring ────────────────────────────────────────────────────────────────


async def get_score_queue_depths() -> dict[str, int]:
    """Return depths of both score queues."""
    redis = get_redis()
    jobs_depth = await redis.llen(SCORE_JOBS_QUEUE_KEY)
    users_depth = await redis.llen(SCORE_USERS_QUEUE_KEY)
    return {"score_jobs": jobs_depth, "score_users": users_depth}
