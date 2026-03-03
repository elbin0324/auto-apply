"""Generic worker base class encapsulating the pop–process–retry loop.

Subclasses only need to implement ``pop_task`` and ``process_task``.
Signal handling, heartbeat, structured logging, retry with backoff,
dead-letter queue, and graceful shutdown are all handled here.

Usage::

    class MyScoreWorker(BaseWorker[ScoreJobsTask]):
        async def pop_task(self) -> tuple[TaskEnvelope, ScoreJobsTask] | None:
            return await pop_score_jobs_task()

        async def process_task(self, task: ScoreJobsTask) -> None:
            await score_new_jobs_for_users(task)

    if __name__ == "__main__":
        MyScoreWorker(name="score").run()
"""

import asyncio
import logging
import signal
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from config import get_settings
from schemas.task_envelope import TaskEnvelope
from services.dlq_service import requeue_with_retry, send_to_dlq
from services.logging_config import clear_task_id, set_task_id, setup_logging
from services.worker_heartbeat import WorkerHeartbeat

T = TypeVar("T")
logger = logging.getLogger(__name__)


class BaseWorker(ABC, Generic[T]):
    """Abstract worker that polls a Redis queue, processes tasks, and retries on failure."""

    def __init__(self, name: str) -> None:
        self.name = name
        self._shutdown = asyncio.Event()

    # ── abstract interface ────────────────────────────────────────────────

    @abstractmethod
    async def pop_task(self) -> tuple[TaskEnvelope, T] | None:
        """Pop one task from the queue. Return None if empty (after blocking timeout)."""

    @abstractmethod
    async def process_task(self, task: T) -> None:
        """Process a single task. Raise on failure to trigger retry/DLQ."""

    # ── optional hooks ────────────────────────────────────────────────────

    def task_label(self, task: T) -> str:
        """Human-readable label for heartbeat status, e.g. 'company:acme'."""
        return ""

    async def preflight(self) -> bool:
        """Run once before the main loop. Return False to abort startup."""
        return True

    async def on_shutdown(self) -> None:
        """Hook called after the main loop exits, before pool close."""

    # ── machinery ─────────────────────────────────────────────────────────

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

        heartbeat = WorkerHeartbeat(self.name)
        await heartbeat.start()
        beat_task = asyncio.create_task(heartbeat.beat_loop(self._shutdown))

        logger.info("%s worker starting", self.name.capitalize())

        while not self._shutdown.is_set():
            result = await self.pop_task()
            if result is None:
                heartbeat.set_idle()
                continue

            envelope, task = result
            set_task_id(str(envelope.task_id))
            label = self.task_label(task)
            heartbeat.set_processing(label or str(envelope.task_id))

            try:
                await self.process_task(task)
                heartbeat.record_success()
            except Exception as exc:
                heartbeat.record_failure()
                queue = envelope.queue_name
                if envelope.retry_count < envelope.max_retries:
                    delay = 2 ** envelope.retry_count
                    logger.warning(
                        "Retrying %s (attempt %d/%d, backoff %ds, task_id=%s)",
                        label, envelope.retry_count + 1, envelope.max_retries,
                        delay, envelope.task_id,
                    )
                    await asyncio.sleep(delay)
                    await requeue_with_retry(envelope.model_dump_json(), queue)
                else:
                    logger.error(
                        "Exhausted retries for %s (task_id=%s), sending to DLQ",
                        label, envelope.task_id,
                    )
                    await send_to_dlq(queue, envelope.model_dump_json(), str(exc))
            finally:
                clear_task_id()
                heartbeat.set_idle()

        await beat_task
        await self.on_shutdown()

        from services.redis_pool import close_pool

        await close_pool()
        logger.info("%s worker shut down cleanly", self.name.capitalize())

    def run(self) -> None:
        """Entry point — install signal handlers and start the async loop."""
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)
        asyncio.run(self._loop())
