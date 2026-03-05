"""Generic worker base class encapsulating the pop-process-retry loop.

Subclasses only need to implement ``pop_task`` and ``process_task``.
Signal handling, heartbeat, structured logging, retry with backoff,
dead-letter queue, task lifecycle tracking, and graceful shutdown are
all handled here.

Usage::

    class MyScoreWorker(BaseWorker[ScoreJobsTask]):
        queue_name = "score:jobs"

        async def pop_task(self) -> tuple[TaskEnvelope, ScoreJobsTask] | None:
            return await pop_score_jobs_task()

        async def process_task(self, task: ScoreJobsTask, envelope: TaskEnvelope) -> None:
            await score_new_jobs_for_users(task)

    if __name__ == "__main__":
        MyScoreWorker(name="score").run()
"""

import asyncio
import logging
import os
import signal
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Generic, TypeVar

from config import get_settings
from schemas.base_task import BaseTask
from schemas.task_envelope import TaskEnvelope
from infra.dlq_service import requeue_with_retry, send_to_dlq
from infra.logging_config import (
    clear_correlation_id,
    clear_task_id,
    set_correlation_id,
    set_task_id,
    setup_logging,
)
from infra.worker_heartbeat import WorkerHeartbeat

T = TypeVar("T")
logger = logging.getLogger(__name__)

# Health check port — Railway sets PORT for web services; workers use a fixed port.
_HEALTH_PORT = int(os.environ.get("HEALTH_PORT", "8080"))

# Task status Redis hash TTLs
_COMPLETED_TTL = 3600  # 1 hour for successful tasks
_FAILED_TTL = 86400  # 24 hours for failed/DLQ tasks

# Queue depth logging interval
_QUEUE_DEPTH_INTERVAL = 300  # 5 minutes


class BaseWorker(ABC, Generic[T]):
    """Abstract worker that polls a Redis queue, processes tasks, and retries on failure."""

    queue_name: str = ""  # Subclasses should set this

    def __init__(self, name: str) -> None:
        self.name = name
        self._shutdown = asyncio.Event()

    # -- abstract interface ----------------------------------------------------

    @abstractmethod
    async def pop_task(self) -> tuple[TaskEnvelope, T] | None:
        """Pop one task from the queue. Return None if empty (after blocking timeout)."""

    @abstractmethod
    async def process_task(self, task: T, envelope: TaskEnvelope) -> None:
        """Process a single task. Raise on failure to trigger retry/DLQ."""

    # -- optional hooks --------------------------------------------------------

    def task_label(self, task: T) -> str:
        """Human-readable label for heartbeat status, e.g. 'company:acme'."""
        return ""

    async def preflight(self) -> bool:
        """Run once before the main loop. Return False to abort startup."""
        return True

    async def on_shutdown(self) -> None:
        """Hook called after the main loop exits, before pool close."""

    # -- structured lifecycle logging ------------------------------------------

    def _log_data(self, task: T, envelope: TaskEnvelope) -> dict:
        """Build base structured data dict from envelope and task."""
        data: dict = {
            "task_type": envelope.task_type,
            "task_id": str(envelope.task_id),
            "queue_name": envelope.queue_name or self.queue_name,
            "source": envelope.source or envelope.source_worker,
            "retry_count": envelope.retry_count,
        }
        if envelope.correlation_id:
            data["correlation_id"] = envelope.correlation_id
        if envelope.user_id:
            data["user_id"] = envelope.user_id
        # Merge task-specific fields from log_summary()
        if isinstance(task, BaseTask):
            data.update(task.log_summary())
        return data

    def _log_event(
        self,
        level: int,
        message: str,
        event: str,
        task: T,
        envelope: TaskEnvelope,
        **extra_fields: object,
    ) -> None:
        """Emit a structured lifecycle log line."""
        data = self._log_data(task, envelope)
        data["event"] = event
        data.update(extra_fields)
        logger.log(level, message, extra={"data": data})

    # -- task lifecycle tracking -----------------------------------------------

    async def _write_task_status(
        self,
        envelope: TaskEnvelope,
        status: str,
        *,
        ttl: int = _COMPLETED_TTL,
        error: str = "",
        duration_ms: int = 0,
    ) -> None:
        """Write task lifecycle event to Redis hash for observability."""
        try:
            from infra.redis_pool import get_redis

            redis = get_redis()
            key = f"task:status:{envelope.task_id}"
            data = {
                "task_id": str(envelope.task_id),
                "task_type": envelope.task_type,
                "user_id": envelope.user_id,
                "correlation_id": envelope.correlation_id,
                "source": envelope.source or envelope.source_worker,
                "queue_name": envelope.queue_name,
                "status": status,
                "created_at": envelope.created_at.isoformat(),
                "worker": self.name,
            }
            if status == "processing":
                data["started_at"] = datetime.now(timezone.utc).isoformat()
            elif status in ("completed", "failed", "dlq"):
                data["completed_at"] = datetime.now(timezone.utc).isoformat()
                if duration_ms:
                    data["duration_ms"] = str(duration_ms)
                if error:
                    data["error"] = error[:500]  # Truncate long errors

            pipe = redis.pipeline()
            pipe.hset(key, mapping=data)
            pipe.expire(key, ttl)
            await pipe.execute()
        except Exception:
            # Status tracking is best-effort -- never fail the task for this
            logger.debug("Failed to write task status for %s", envelope.task_id)

    async def _log_queue_depth(self) -> None:
        """Log the current queue depth (best-effort)."""
        if not self.queue_name:
            return
        try:
            from infra.redis_pool import get_redis

            redis = get_redis()
            depth = await redis.llen(self.queue_name)
            logger.info(
                "Queue depth: %s = %d",
                self.queue_name,
                depth,
                extra={"data": {"event": "queue_depth", "queue_name": self.queue_name, "depth": depth}},
            )
        except Exception:
            logger.debug("Failed to check queue depth for %s", self.queue_name)

    # -- health check HTTP server ----------------------------------------------

    async def _health_handler(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        """Minimal HTTP handler — responds 200 to any request."""
        try:
            await reader.read(1024)  # consume request
            body = f'{{"worker":"{self.name}","status":"ok"}}'
            response = (
                f"HTTP/1.1 200 OK\r\n"
                f"Content-Type: application/json\r\n"
                f"Content-Length: {len(body)}\r\n"
                f"\r\n"
                f"{body}"
            )
            writer.write(response.encode())
            await writer.drain()
        except Exception:
            pass
        finally:
            writer.close()

    async def _start_health_server(self) -> asyncio.Server | None:
        """Start a lightweight TCP health check server for Railway."""
        try:
            server = await asyncio.start_server(self._health_handler, "0.0.0.0", _HEALTH_PORT)
            logger.info("Health check listening on port %d", _HEALTH_PORT)
            return server
        except OSError:
            logger.warning("Could not bind health check port %d (already in use?)", _HEALTH_PORT)
            return None

    # -- machinery -------------------------------------------------------------

    def _handle_signal(self, signum: int, _frame: object) -> None:
        logger.info("Received signal %s, initiating graceful shutdown...", signum)
        self._shutdown.set()

    async def _loop(self) -> None:
        settings = get_settings()
        setup_logging(self.name)

        if settings.sentry_dsn:
            import sentry_sdk

            sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.env)

        if not await self.preflight():
            return

        health_server = await self._start_health_server()

        heartbeat = WorkerHeartbeat(self.name)
        await heartbeat.start()
        beat_task = asyncio.create_task(heartbeat.beat_loop(self._shutdown))

        logger.info("%s worker starting", self.name.capitalize())

        # Log initial queue depth
        await self._log_queue_depth()
        last_depth_log = time.monotonic()

        while not self._shutdown.is_set():
            result = await self.pop_task()
            if result is None:
                heartbeat.set_idle()
                # Periodic queue depth logging during idle
                now = time.monotonic()
                if now - last_depth_log >= _QUEUE_DEPTH_INTERVAL:
                    await self._log_queue_depth()
                    last_depth_log = now
                continue

            envelope, task = result
            set_task_id(str(envelope.task_id))
            if envelope.correlation_id:
                set_correlation_id(envelope.correlation_id)
            label = self.task_label(task)
            heartbeat.set_processing(label or str(envelope.task_id))

            # -- task_dequeued --
            self._log_event(
                logging.INFO, "Task dequeued", "task_dequeued", task, envelope,
            )

            # Track task start
            await self._write_task_status(envelope, "processing")
            start_time = time.monotonic()

            try:
                await self.process_task(task, envelope)
                heartbeat.record_success()
                duration_ms = int((time.monotonic() - start_time) * 1000)
                await self._write_task_status(
                    envelope, "completed", duration_ms=duration_ms
                )
                # -- task_completed --
                self._log_event(
                    logging.INFO, "Task completed", "task_completed", task, envelope,
                    duration_ms=duration_ms,
                )
            except Exception as exc:
                heartbeat.record_failure()
                duration_ms = int((time.monotonic() - start_time) * 1000)
                queue = envelope.queue_name
                if envelope.retry_count < envelope.max_retries:
                    delay = 2 ** envelope.retry_count
                    # -- task_retry --
                    self._log_event(
                        logging.WARNING, "Task retry", "task_retry", task, envelope,
                        duration_ms=duration_ms,
                        error=str(exc),
                        attempt=envelope.retry_count + 1,
                        max_retries=envelope.max_retries,
                        backoff_seconds=delay,
                    )
                    await self._write_task_status(
                        envelope, "failed",
                        ttl=_FAILED_TTL,
                        error=str(exc),
                        duration_ms=duration_ms,
                    )
                    await asyncio.sleep(delay)
                    await requeue_with_retry(envelope.model_dump_json(), queue)
                else:
                    # -- task_dlq --
                    self._log_event(
                        logging.ERROR, "Task sent to DLQ", "task_dlq", task, envelope,
                        duration_ms=duration_ms,
                        error=str(exc),
                    )
                    await self._write_task_status(
                        envelope, "dlq",
                        ttl=_FAILED_TTL,
                        error=str(exc),
                        duration_ms=duration_ms,
                    )
                    await send_to_dlq(queue, envelope.model_dump_json(), str(exc))
            finally:
                clear_task_id()
                clear_correlation_id()
                heartbeat.set_idle()

        await beat_task
        if health_server:
            health_server.close()
            await health_server.wait_closed()
        await self.on_shutdown()

        from infra.redis_pool import close_pool

        await close_pool()
        logger.info("%s worker shut down cleanly", self.name.capitalize())

    def run(self) -> None:
        """Entry point -- install signal handlers and start the async loop."""
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)
        asyncio.run(self._loop())
