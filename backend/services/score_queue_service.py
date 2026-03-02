"""Redis queue service for scoring tasks (score:jobs and score:users)."""

import logging

from redis.asyncio import Redis

from config import get_settings
from schemas.crawl import ScoreJobsTask, ScoreUserTask

logger = logging.getLogger(__name__)

SCORE_JOBS_QUEUE_KEY = "score:jobs"
SCORE_USERS_QUEUE_KEY = "score:users"


async def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


# ── score:jobs queue ──────────────────────────────────────────────────────────


async def push_score_jobs_task(task: ScoreJobsTask) -> None:
    """Push a batch of job IDs for scoring after a crawl."""
    redis = await get_redis()
    try:
        await redis.rpush(SCORE_JOBS_QUEUE_KEY, task.model_dump_json())
        logger.info(
            "Pushed score:jobs task for company %s (%d jobs)",
            task.company_id,
            len(task.job_ids),
        )
    finally:
        await redis.aclose()


async def pop_score_jobs_task() -> ScoreJobsTask | None:
    """Pop one score:jobs task (blocking with 5s timeout)."""
    redis = await get_redis()
    try:
        result = await redis.blpop(SCORE_JOBS_QUEUE_KEY, timeout=5)
        if result is None:
            return None
        _, payload = result
        return ScoreJobsTask.model_validate_json(payload)
    finally:
        await redis.aclose()


# ── score:users queue ─────────────────────────────────────────────────────────


async def push_score_user_task(task: ScoreUserTask) -> None:
    """Push a user for re-scoring with 5-minute deduplication."""
    redis = await get_redis()
    try:
        dedup_key = f"score:user:dedup:{task.user_id}"
        was_set = await redis.set(dedup_key, "1", nx=True, ex=300)  # 5-min dedup
        if not was_set:
            logger.debug("Score task for user %s already pending", task.user_id)
            return
        await redis.rpush(SCORE_USERS_QUEUE_KEY, task.model_dump_json())
        logger.info("Pushed score:users task for user %s (%s)", task.user_id, task.reason)
    finally:
        await redis.aclose()


async def pop_score_user_task() -> ScoreUserTask | None:
    """Pop one score:users task (blocking with 5s timeout)."""
    redis = await get_redis()
    try:
        result = await redis.blpop(SCORE_USERS_QUEUE_KEY, timeout=5)
        if result is None:
            return None
        _, payload = result
        return ScoreUserTask.model_validate_json(payload)
    finally:
        await redis.aclose()


# ── monitoring ────────────────────────────────────────────────────────────────


async def get_score_queue_depths() -> dict[str, int]:
    """Return depths of both score queues."""
    redis = await get_redis()
    try:
        jobs_depth = await redis.llen(SCORE_JOBS_QUEUE_KEY)
        users_depth = await redis.llen(SCORE_USERS_QUEUE_KEY)
        return {"score_jobs": jobs_depth, "score_users": users_depth}
    finally:
        await redis.aclose()
