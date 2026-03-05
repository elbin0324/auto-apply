"""Enrich worker — polls enrich:jobs, enriches via LLM.

Run with: cd backend && poetry run python -m workers.enrich
Scale by running multiple instances.
"""

import logging

from config import get_settings
from db.session import AsyncSessionLocal
from schemas.enrichment import EnrichJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.base import BaseWorker
from workers.queues.enrich import pop_enrich_task
from workers.services.job_enrichment import enrich_jobs_batch

logger = logging.getLogger("enrich_worker")


class EnrichWorker(BaseWorker[EnrichJobsTask]):
    queue_name = "enrich:jobs"

    async def preflight(self) -> bool:
        if not get_settings().anthropic_api_key:
            logger.error("ANTHROPIC_API_KEY not configured, enrich worker cannot start")
            return False
        return True

    async def pop_task(self) -> tuple[TaskEnvelope, EnrichJobsTask] | None:
        return await pop_enrich_task()

    async def process_task(self, task: EnrichJobsTask, envelope: TaskEnvelope) -> None:
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
                raise  # Let BaseWorker handle retry/DLQ

    def task_label(self, task: EnrichJobsTask) -> str:
        return f"jobs:{len(task.job_ids)}"


if __name__ == "__main__":
    EnrichWorker("enrich").run()
