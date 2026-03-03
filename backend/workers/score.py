"""Score worker — polls score:jobs queue, runs heuristic scoring.

Run with: cd backend && poetry run python -m workers.score

Scores new jobs against all active users using skill/title/location
matching. Architecture is ready for LLM-based scoring in the future.
"""

import logging
import os
import sys

# Make backend/ importable when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import AsyncSessionLocal  # noqa: E402
from schemas.crawl import ScoreJobsTask  # noqa: E402
from schemas.task_envelope import TaskEnvelope  # noqa: E402
from services.score_queue_service import pop_score_jobs_task  # noqa: E402
from services.score_service import score_new_jobs_for_users  # noqa: E402
from services.worker_base import BaseWorker  # noqa: E402

logger = logging.getLogger("score_worker")


class ScoreWorker(BaseWorker[ScoreJobsTask]):
    async def pop_task(self) -> tuple[TaskEnvelope, ScoreJobsTask] | None:
        return await pop_score_jobs_task()

    async def process_task(self, task: ScoreJobsTask) -> None:
        async with AsyncSessionLocal() as db:
            try:
                score_stats = await score_new_jobs_for_users(db, task.job_ids)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Scoring failed for %d jobs", len(task.job_ids))
                raise

        logger.info("Score jobs complete: %d jobs, %s", len(task.job_ids), score_stats)

    def task_label(self, task: ScoreJobsTask) -> str:
        return f"jobs:{len(task.job_ids)}"


if __name__ == "__main__":
    ScoreWorker("score").run()
