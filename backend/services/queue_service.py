import logging

from redis.asyncio import Redis

from config import get_settings
from schemas.auto_apply import ApplyTask

logger = logging.getLogger(__name__)

QUEUE_KEY = "auto_apply:tasks"


async def get_redis() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.redis_url, decode_responses=True)


async def push_apply_task(task: ApplyTask) -> None:
    redis = await get_redis()
    payload = task.model_dump_json()
    await redis.rpush(QUEUE_KEY, payload)
    logger.info("Pushed apply task for application %s", task.application_id)
    await redis.aclose()


async def get_queue_depth() -> int:
    redis = await get_redis()
    depth: int = await redis.llen(QUEUE_KEY)
    await redis.aclose()
    return depth
