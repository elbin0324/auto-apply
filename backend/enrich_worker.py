"""Standalone enrich worker — polls enrich:jobs, enriches via LLM.

Run with: cd backend && poetry run python enrich_worker.py
Scale by running multiple instances.
"""

import asyncio
import logging
import os
import signal
import sys

# Make backend/ importable
sys.path.insert(0, os.path.dirname(__file__))

from config import get_settings  # noqa: E402
from db.session import AsyncSessionLocal  # noqa: E402
from services.enrich_queue_service import pop_enrich_task  # noqa: E402
from services.job_enrichment import enrich_jobs_batch  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("enrich_worker")

_shutdown = asyncio.Event()


def _handle_signal(signum: int, _frame: object) -> None:
    logger.info("Received signal %s, initiating graceful shutdown...", signum)
    _shutdown.set()


async def process_enrich_task(task: object) -> None:
    """Enrich a batch of jobs via LLM."""
    async with AsyncSessionLocal() as db:
        try:
            stats = await enrich_jobs_batch(db, task.job_ids)
            await db.commit()
            logger.info(
                "Enrich complete for company %s: %d enriched, %d skipped, %d failed, %d salary backfills",
                task.company_id,
                stats.jobs_enriched,
                stats.jobs_skipped,
                stats.jobs_failed,
                stats.salary_backfills,
            )
        except Exception:
            await db.rollback()
            logger.exception("Error processing enrich task for company %s", task.company_id)


async def worker_loop() -> None:
    """Main worker loop: poll enrich:jobs queue, process tasks."""
    settings = get_settings()

    if not settings.anthropic_api_key:
        logger.error("ANTHROPIC_API_KEY not configured, enrich worker cannot start")
        return

    logger.info("Enrich worker starting, polling enrich:jobs")

    while not _shutdown.is_set():
        task = await pop_enrich_task()
        if task is None:
            continue
        await process_enrich_task(task)

    logger.info("Enrich worker shut down cleanly")


def main() -> None:
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)
    asyncio.run(worker_loop())


if __name__ == "__main__":
    main()
