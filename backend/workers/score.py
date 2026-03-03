"""Score worker — polls score:jobs and score:users, embeds and scores.

Run with: cd backend && poetry run python -m workers.score

Alternates between score:jobs (higher priority — new content to index)
and score:users (triggered by profile updates or scheduled re-scoring).
"""

import logging
import os
import sys

# Make backend/ importable when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings  # noqa: E402
from db.session import AsyncSessionLocal  # noqa: E402
from schemas.crawl import ScoreJobsTask, ScoreUserTask  # noqa: E402
from schemas.task_envelope import TaskEnvelope  # noqa: E402
from services.score_queue_service import pop_score_jobs_task, pop_score_user_task  # noqa: E402
from services.score_service import (  # noqa: E402
    embed_and_store_jobs,
    embed_and_store_user,
    score_new_jobs_for_users,
    score_user_against_all_jobs,
)
from services.worker_base import BaseWorker  # noqa: E402

logger = logging.getLogger("score_worker")

ScoreTask = ScoreJobsTask | ScoreUserTask


class ScoreWorker(BaseWorker[ScoreTask]):
    async def preflight(self) -> bool:
        if not get_settings().voyage_api_key:
            logger.error("VOYAGE_API_KEY not configured, score worker cannot start")
            return False
        return True

    async def pop_task(self) -> tuple[TaskEnvelope, ScoreTask] | None:
        # Check score:jobs first (higher priority — new content to index)
        result = await pop_score_jobs_task()
        if result:
            return result
        return await pop_score_user_task()

    async def process_task(self, task: ScoreTask) -> None:
        if isinstance(task, ScoreJobsTask):
            await self._process_jobs(task)
        else:
            await self._process_user(task)

    def task_label(self, task: ScoreTask) -> str:
        if isinstance(task, ScoreJobsTask):
            return f"jobs:company:{task.company_id}"
        return f"user:{task.user_id}"

    async def _process_jobs(self, task: ScoreJobsTask) -> None:
        """Embed new jobs and score them for active users."""
        # Step 1: Embed un-embedded jobs
        async with AsyncSessionLocal() as db:
            try:
                embed_stats = await embed_and_store_jobs(db, task.job_ids)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Embedding failed for company %s", task.company_id)
                return

        # Step 2: Score new jobs for all active users
        async with AsyncSessionLocal() as db:
            try:
                score_stats = await score_new_jobs_for_users(db, task.job_ids)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Scoring failed for company %s", task.company_id)
                return

        logger.info(
            "Score jobs complete for company %s: embed=%s, score=%s",
            task.company_id,
            embed_stats,
            score_stats,
        )

    async def _process_user(self, task: ScoreUserTask) -> None:
        """Embed user profile and score against all jobs."""
        # Step 1: Embed the user profile
        async with AsyncSessionLocal() as db:
            try:
                embedded = await embed_and_store_user(db, task.user_id)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Embedding failed for user %s", task.user_id)
                return

        if not embedded:
            logger.warning("Could not embed user %s, skipping scoring", task.user_id)
            return

        # Step 2: Vector search + heuristic re-rank
        async with AsyncSessionLocal() as db:
            try:
                score_stats = await score_user_against_all_jobs(db, task.user_id)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Scoring failed for user %s", task.user_id)
                return

        logger.info("Score user complete for %s: %s", task.user_id, score_stats)


if __name__ == "__main__":
    ScoreWorker("score").run()
