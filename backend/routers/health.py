import logging
import time

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from config import get_settings
from db.session import AsyncSessionLocal
from services.redis_pool import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])
settings = get_settings()


class ServiceCheck(BaseModel):
    status: str  # "ok" or "error"
    latency_ms: float
    detail: str = ""


class WorkerSummary(BaseModel):
    name: str
    status: str  # "idle", "processing", "offline"
    is_alive: bool


class HealthResponse(BaseModel):
    status: str  # "ok", "degraded", "error"
    version: str
    db: ServiceCheck | None = None
    redis: ServiceCheck | None = None
    workers: list[WorkerSummary] = []


class SchedulerHealthResponse(BaseModel):
    status: str
    worker_count: int
    detail: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Rich health check — verifies DB, Redis, and worker heartbeats.

    Always returns HTTP 200 so Railway treats the service as healthy.
    The ``status`` field conveys actual health: ok / degraded / error.
    """
    db_check = await _check_db()
    redis_check = await _check_redis()

    workers: list[WorkerSummary] = []
    if redis_check.status == "ok":
        workers = await _check_workers()

    # Determine overall status
    if db_check.status == "error" or redis_check.status == "error":
        overall = "error"
    elif not workers or not any(w.is_alive for w in workers):
        overall = "degraded"
    else:
        overall = "ok"

    return HealthResponse(
        status=overall,
        version=settings.version,
        db=db_check,
        redis=redis_check,
        workers=workers,
    )


@router.get("/health/scheduler", response_model=SchedulerHealthResponse)
async def scheduler_health() -> SchedulerHealthResponse:
    """Check if the arq scheduler worker is running by looking for its heartbeat keys."""
    try:
        redis = get_redis()
        # arq stores worker health keys under arq:worker:*
        keys = await redis.keys("arq:worker:*")
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
    except Exception as e:
        logger.warning("Failed to check scheduler health: %s", e)
        return SchedulerHealthResponse(
            status="error",
            worker_count=0,
            detail=f"Could not connect to Redis: {e}",
        )


async def _check_db() -> ServiceCheck:
    try:
        start = time.monotonic()
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        latency = (time.monotonic() - start) * 1000
        return ServiceCheck(status="ok", latency_ms=round(latency, 1))
    except Exception as e:
        return ServiceCheck(status="error", latency_ms=0, detail=str(e))


async def _check_redis() -> ServiceCheck:
    try:
        redis = get_redis()
        start = time.monotonic()
        await redis.ping()
        latency = (time.monotonic() - start) * 1000
        return ServiceCheck(status="ok", latency_ms=round(latency, 1))
    except Exception as e:
        return ServiceCheck(status="error", latency_ms=0, detail=str(e))


async def _check_workers() -> list[WorkerSummary]:
    try:
        from services.worker_heartbeat import get_all_worker_statuses

        statuses = await get_all_worker_statuses()
        return [
            WorkerSummary(
                name=s["name"],
                status=s.get("status", "offline"),
                is_alive=s.get("is_alive", False),
            )
            for s in statuses
        ]
    except Exception:
        logger.warning("Failed to fetch worker statuses")
        return []
