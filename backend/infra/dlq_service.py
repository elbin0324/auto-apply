"""Dead-letter queue (DLQ) service for failed tasks.

Tasks that exhaust retries are moved to `dlq:{queue_name}` lists in Redis.
Admin endpoints can peek, replay, or purge DLQ items.
"""

import json
import logging
from datetime import datetime, timezone

from infra.redis_pool import get_redis

logger = logging.getLogger(__name__)

DLQ_PREFIX = "dlq:"


async def send_to_dlq(queue_name: str, envelope_json: str, error_message: str) -> None:
    """Move a failed envelope to the dead-letter queue for its original queue."""
    redis = get_redis()
    dlq_key = f"{DLQ_PREFIX}{queue_name}"
    item = json.dumps({
        "envelope": json.loads(envelope_json),
        "error": error_message,
        "failed_at": datetime.now(timezone.utc).isoformat(),
    })
    await redis.rpush(dlq_key, item)
    logger.warning("Sent task to DLQ %s: %s", dlq_key, error_message[:200])


async def get_dlq_depths() -> dict[str, int]:
    """Return depths of all DLQ queues."""
    redis = get_redis()
    depths: dict[str, int] = {}
    async for key in redis.scan_iter(match=f"{DLQ_PREFIX}*", count=100):
        queue_name = key.removeprefix(DLQ_PREFIX)
        depth = await redis.llen(key)
        if depth > 0:
            depths[queue_name] = depth
    return depths


async def peek_dlq(queue_name: str, count: int = 10) -> list[dict]:
    """Peek at items in a DLQ without removing them."""
    redis = get_redis()
    dlq_key = f"{DLQ_PREFIX}{queue_name}"
    raw_items = await redis.lrange(dlq_key, 0, count - 1)
    return [json.loads(item) for item in raw_items]


async def replay_dlq_item(queue_name: str) -> bool:
    """Pop one item from a DLQ and re-enqueue it to the original queue.

    The envelope is re-enqueued as-is (retry_count preserved) so the worker
    can attempt processing again.  Returns True if an item was replayed.
    """
    redis = get_redis()
    dlq_key = f"{DLQ_PREFIX}{queue_name}"
    raw = await redis.lpop(dlq_key)
    if raw is None:
        return False
    item = json.loads(raw)
    envelope_json = json.dumps(item["envelope"])
    await redis.rpush(queue_name, envelope_json)
    logger.info("Replayed DLQ item to %s", queue_name)
    return True


async def purge_dlq(queue_name: str) -> int:
    """Delete all items from a DLQ. Returns the number of items purged."""
    redis = get_redis()
    dlq_key = f"{DLQ_PREFIX}{queue_name}"
    count = await redis.llen(dlq_key)
    if count > 0:
        await redis.delete(dlq_key)
    return count


async def requeue_with_retry(envelope_json: str, queue_name: str) -> None:
    """Re-enqueue an envelope with incremented retry count."""
    redis = get_redis()
    data = json.loads(envelope_json)
    data["retry_count"] = data.get("retry_count", 0) + 1
    await redis.rpush(queue_name, json.dumps(data))
