import logging

from schemas.auto_apply import ApplyTask
from infra.redis_pool import get_redis

logger = logging.getLogger(__name__)

QUEUE_KEY = "auto_apply:tasks"


async def push_apply_task(task: ApplyTask) -> None:
    redis = get_redis()
    payload = task.model_dump_json()
    await redis.rpush(QUEUE_KEY, payload)
    logger.info("Pushed apply task for application %s", task.application_id)


async def get_queue_depth() -> int:
    redis = get_redis()
    depth: int = await redis.llen(QUEUE_KEY)
    return depth
