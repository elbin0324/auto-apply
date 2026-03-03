"""Enrich worker — polls enrich:jobs, enriches via LLM.

Run with: cd backend && poetry run python -m workers.enrich
Scale by running multiple instances.
"""

import logging
import os
import sys

# Make backend/ importable when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings  # noqa: E402
from db.session import AsyncSessionLocal  # noqa: E402
from schemas.enrichment import EnrichJobsTask  # noqa: E402
from schemas.task_envelope import TaskEnvelope  # noqa: E402
from services.enrich_queue_service import pop_enrich_task  # noqa: E402
from services.job_enrichment import enrich_jobs_batch  # noqa: E402
from services.worker_base import BaseWorker  # noqa: E402

logger = logging.getLogger("enrich_worker")


class EnrichWorker(BaseWorker[EnrichJobsTask]):
    async def preflight(self) -> bool:
        if not get_settings().anthropic_api_key:
            logger.error("ANTHROPIC_API_KEY not configured, enrich worker cannot start")
            return False
        return True

    async def pop_task(self) -> tuple[TaskEnvelope, EnrichJobsTask] | None:
        return await pop_enrich_task()

    async def process_task(self, task: EnrichJobsTask) -> None:
        async with AsyncSessionLocal() as db:
            try:
                stats = await enrich_jobs_batch(db, task.job_ids)
                await db.commit()
                logger.info(
                    "Enrich complete: %d enriched, %d skipped, %d failed, %d salary backfills",
                    stats.jobs_enriched,
                    stats.jobs_skipped,
                    stats.jobs_failed,
                    stats.salary_backfills,
                )
            except Exception:
                await db.rollback()
                logger.exception("Error processing enrich task for %d jobs", len(task.job_ids))

    def task_label(self, task: EnrichJobsTask) -> str:
        return f"jobs:{len(task.job_ids)}"


if __name__ == "__main__":
    EnrichWorker("enrich").run()
