"""Publish SSE events to per-user Redis pub/sub channels."""

import json
import logging
import uuid
from typing import Any

from infra.redis_pool import get_redis

logger = logging.getLogger(__name__)

CHANNEL_PREFIX = "sse:user:"


def _channel(user_id: uuid.UUID) -> str:
    return f"{CHANNEL_PREFIX}{user_id}"


async def publish_user_event(
    user_id: uuid.UUID,
    event_type: str,
    data: dict[str, Any],
) -> None:
    """Publish a JSON event to the user's SSE channel.

    Args:
        user_id: Target user.
        event_type: Event name (e.g. "progress", "result").
        data: Payload dict — must be JSON-serialisable.
    """
    redis = get_redis()
    payload = json.dumps({"type": event_type, "data": data})
    try:
        await redis.publish(_channel(user_id), payload)
    except Exception:
        logger.exception("Failed to publish SSE event for user %s", user_id)
