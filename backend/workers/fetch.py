"""Fetch worker — polls fetch:jobs queue, fetches from Active Jobs DB API.

For each task, loads the user's AutoApplyConfig, queries the Active Jobs DB
API, upserts results to the Job table, and pushes downstream to score:jobs.

Run with: cd backend && poetry run python -m workers.fetch
"""

import logging

from config import get_settings
from db.session import AsyncSessionLocal
from schemas.queue_tasks import FetchJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.base import BaseWorker
from workers.queues.fetch import pop_fetch_task

logger = logging.getLogger("fetch_worker")


class FetchWorker(BaseWorker[FetchJobsTask]):
    queue_name = "fetch:jobs"

    def __init__(self) -> None:
        super().__init__("fetch")

    async def preflight(self) -> bool:
        settings = get_settings()
        if not settings.rapidapi_key:
            logger.error("RAPIDAPI_KEY not configured, fetch worker cannot start")
            return False
        return True

    async def pop_task(self) -> tuple[TaskEnvelope, FetchJobsTask] | None:
        return await pop_fetch_task()

    async def process_task(self, task: FetchJobsTask, envelope: TaskEnvelope) -> None:
        from sqlalchemy import select

        from models.auto_apply_config import AutoApplyConfig
        from workers.services.job_fetch import (
            _build_search_params,
            _upsert_jobs,
        )
        from workers.services.job_search_api import search_jobs_advanced
        from infra.task_queue import enqueue_score_jobs

        async with AsyncSessionLocal() as db:
            try:
                # Load user config
                result = await db.execute(
                    select(AutoApplyConfig).where(
                        AutoApplyConfig.user_id == task.user_id
                    )
                )
                config = result.scalar_one_or_none()
                if not config:
                    logger.warning(
                        "No AutoApplyConfig for user %s, skipping", task.user_id
                    )
                    return

                # Build search params from user preferences
                params = _build_search_params(config)
                if not params:
                    logger.debug(
                        "No search params for user %s (no target titles)",
                        task.user_id,
                    )
                    return

                # Query Active Jobs DB API
                results = await search_jobs_advanced(
                    params, recent_only=task.recent_only
                )
                if not results:
                    logger.info("No jobs found for user %s", task.user_id)
                    return

                # Upsert to DB
                job_ids = await _upsert_jobs(db, results)
                await db.flush()

                # Push downstream to score queue (per-user)
                if job_ids:
                    from uuid import UUID

                    correlation_id = None
                    if envelope.correlation_id:
                        try:
                            correlation_id = UUID(envelope.correlation_id)
                        except ValueError:
                            pass
                    await enqueue_score_jobs(
                        task.user_id,
                        source="job_fetch",
                        correlation_id=correlation_id,
                    )

                await db.commit()
                logger.info(
                    "Fetched jobs for user %s: api_results=%d, upserted=%d, recent_only=%s",
                    task.user_id,
                    len(results),
                    len(job_ids),
                    task.recent_only,
                )
            except Exception:
                await db.rollback()
                logger.exception(
                    "Fetch failed for user %s (recent_only=%s)",
                    task.user_id,
                    task.recent_only,
                )
                raise

    def task_label(self, task: FetchJobsTask) -> str:
        return f"user:{task.user_id}"


if __name__ == "__main__":
    FetchWorker().run()
