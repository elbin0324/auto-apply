"""SSE endpoint — streams real-time application events to authenticated users."""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from deps import SSEUser
from infra.event_publisher import CHANNEL_PREFIX
from infra.redis_pool import get_pool

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sse"])

KEEPALIVE_INTERVAL = 15  # seconds


async def _event_stream(
    user_id: str,
    request: Request,
) -> AsyncGenerator[str, None]:
    """Subscribe to the user's Redis pub/sub channel and yield SSE frames."""
    # Each SSE connection needs its own Redis client for pub/sub
    redis = aioredis.Redis(connection_pool=get_pool())
    pubsub = redis.pubsub()
    channel = f"{CHANNEL_PREFIX}{user_id}"

    try:
        await pubsub.subscribe(channel)
        logger.info("SSE: subscribed to %s", channel)

        while True:
            if await request.is_disconnected():
                break

            try:
                msg = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0),
                    timeout=KEEPALIVE_INTERVAL,
                )
            except asyncio.TimeoutError:
                msg = None

            if msg and msg["type"] == "message":
                raw = msg["data"]
                payload = json.loads(raw) if isinstance(raw, str) else json.loads(raw.decode())
                event_type = payload.get("type", "message")
                data = json.dumps(payload.get("data", {}))
                yield f"event: {event_type}\ndata: {data}\n\n"
            else:
                # Keepalive comment — prevents proxies from closing idle connections
                yield ": keepalive\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        logger.info("SSE: unsubscribed from %s", channel)


@router.get("/applications/stream")
async def application_stream(
    user: SSEUser,
    request: Request,
) -> StreamingResponse:
    """Stream application progress/result events to the authenticated user."""
    return StreamingResponse(
        _event_stream(str(user.id), request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
