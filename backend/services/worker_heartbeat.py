"""Redis-based heartbeat system for standalone workers.

Each worker writes a Redis hash every BEAT_INTERVAL seconds with TTL of HEARTBEAT_TTL.
If the worker dies, the key expires and the admin panel shows it as offline.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from redis.asyncio import Redis

from config import get_settings

logger = logging.getLogger(__name__)

HEARTBEAT_TTL = 30  # seconds before key expires if worker dies
BEAT_INTERVAL = 10  # seconds between heartbeat refreshes

# All known standalone worker names (used for reading status)
WORKER_NAMES = ["crawl", "score", "enrich"]


class WorkerHeartbeat:
    """Tracks liveness and metrics for a single worker process."""

    def __init__(self, worker_name: str) -> None:
        self.worker_name = worker_name
        self.worker_id = str(uuid.uuid4())[:8]
        self.key = f"worker:heartbeat:{worker_name}"
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.tasks_processed = 0
        self.tasks_failed = 0
        self._current_task: str = ""
        self._redis: Redis | None = None

    async def start(self) -> None:
        settings = get_settings()
        self._redis = Redis.from_url(settings.redis_url, decode_responses=True)
        await self._write()

    async def stop(self) -> None:
        if self._redis:
            await self._redis.delete(self.key)
            await self._redis.aclose()

    async def _write(self) -> None:
        if not self._redis:
            return
        data = {
            "worker_id": self.worker_id,
            "started_at": self.started_at,
            "last_beat_at": datetime.now(timezone.utc).isoformat(),
            "tasks_processed": str(self.tasks_processed),
            "tasks_failed": str(self.tasks_failed),
            "current_task": self._current_task,
            "status": "processing" if self._current_task else "idle",
        }
        pipe = self._redis.pipeline()
        pipe.hset(self.key, mapping=data)
        pipe.expire(self.key, HEARTBEAT_TTL)
        await pipe.execute()

    def set_processing(self, task_description: str) -> None:
        self._current_task = task_description

    def set_idle(self) -> None:
        self._current_task = ""

    def record_success(self) -> None:
        self.tasks_processed += 1

    def record_failure(self) -> None:
        self.tasks_failed += 1

    async def beat_loop(self, shutdown_event: asyncio.Event) -> None:
        """Run as a background task — refreshes heartbeat every BEAT_INTERVAL seconds."""
        while not shutdown_event.is_set():
            try:
                await self._write()
            except Exception:
                logger.warning("Failed to write heartbeat for %s", self.worker_name)
            try:
                await asyncio.wait_for(shutdown_event.wait(), timeout=BEAT_INTERVAL)
            except asyncio.TimeoutError:
                pass
        await self.stop()


async def get_all_worker_statuses() -> list[dict]:
    """Read heartbeat data for all known workers + arq scheduler.

    Returns a list of dicts suitable for constructing WorkerStatus schemas.
    """
    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        statuses = []

        # Standalone workers (crawl, score, enrich)
        for name in WORKER_NAMES:
            key = f"worker:heartbeat:{name}"
            data = await redis.hgetall(key)
            if data:
                statuses.append({
                    "name": name,
                    "worker_id": data.get("worker_id"),
                    "started_at": data.get("started_at"),
                    "last_beat_at": data.get("last_beat_at"),
                    "tasks_processed": int(data.get("tasks_processed", 0)),
                    "tasks_failed": int(data.get("tasks_failed", 0)),
                    "current_task": data.get("current_task", ""),
                    "status": data.get("status", "idle"),
                    "is_alive": True,
                })
            else:
                statuses.append({
                    "name": name,
                    "worker_id": None,
                    "started_at": None,
                    "last_beat_at": None,
                    "tasks_processed": 0,
                    "tasks_failed": 0,
                    "current_task": "",
                    "status": "offline",
                    "is_alive": False,
                })

        # arq scheduler — check for arq:worker:* keys
        arq_keys = []
        async for key in redis.scan_iter("arq:worker:*"):
            arq_keys.append(key)
        if arq_keys:
            statuses.append({
                "name": "scheduler",
                "worker_id": arq_keys[0].split(":")[-1] if arq_keys else None,
                "started_at": None,
                "last_beat_at": None,
                "tasks_processed": 0,
                "tasks_failed": 0,
                "current_task": "",
                "status": "idle",
                "is_alive": True,
            })
        else:
            statuses.append({
                "name": "scheduler",
                "worker_id": None,
                "started_at": None,
                "last_beat_at": None,
                "tasks_processed": 0,
                "tasks_failed": 0,
                "current_task": "",
                "status": "offline",
                "is_alive": False,
            })

        return statuses
    finally:
        await redis.aclose()
