import logging
import time

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from config import get_settings
from db.session import AsyncSessionLocal
from infra.redis_pool import get_redis

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
        from infra.worker_heartbeat import get_all_worker_statuses

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
