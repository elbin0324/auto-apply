import logging

import redis.asyncio as aioredis
from fastapi import APIRouter
from pydantic import BaseModel

from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    version: str


class SchedulerHealthResponse(BaseModel):
    status: str
    worker_count: int
    detail: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", version=settings.version)


@router.get("/health/scheduler", response_model=SchedulerHealthResponse)
async def scheduler_health() -> SchedulerHealthResponse:
    """Check if the arq scheduler worker is running by looking for its heartbeat keys."""
    try:
        r = aioredis.from_url(settings.redis_url)
        try:
            # arq stores worker health keys under arq:worker:*
            keys = await r.keys("arq:worker:*")
            worker_count = len(keys)
            if worker_count > 0:
                return SchedulerHealthResponse(
                    status="ok",
                    worker_count=worker_count,
                    detail=f"{worker_count} arq worker(s) running",
                )
            return SchedulerHealthResponse(
                status="warning",
                worker_count=0,
                detail="No arq workers detected — scheduled tasks will not run",
            )
        finally:
            await r.aclose()
    except Exception as e:
        logger.warning("Failed to check scheduler health: %s", e)
        return SchedulerHealthResponse(
            status="error",
            worker_count=0,
            detail=f"Could not connect to Redis: {e}",
        )
