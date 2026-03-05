"""Shared Redis connection pool — single pool for the entire process.

All queue services, heartbeat, and health checks should import `get_redis()`
from here instead of creating their own connections.
"""

import redis.asyncio as aioredis

from config import get_settings

_pool: aioredis.ConnectionPool | None = None


def get_pool() -> aioredis.ConnectionPool:
    """Return (and lazily create) the shared connection pool."""
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = aioredis.ConnectionPool.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=20,
        )
    return _pool


def get_redis() -> aioredis.Redis:
    """Return a Redis client backed by the shared pool.

    Do NOT call aclose() on the returned client — the pool manages connections.
    """
    return aioredis.Redis(connection_pool=get_pool())


async def close_pool() -> None:
    """Call during process shutdown to clean up."""
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
