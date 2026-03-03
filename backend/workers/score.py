"""Score worker — polls score:jobs queue, runs LLM-based or heuristic scoring.

Run with: cd backend && poetry run python -m workers.score

When scoring_use_llm=True (default), scores jobs via batched LLM calls.
When scoring_use_llm=False, falls back to heuristic skill/title/location matching.
"""

import logging
import os
import sys

# Make backend/ importable when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings  # noqa: E402
from db.session import AsyncSessionLocal  # noqa: E402
from schemas.crawl import ScoreJobsTask  # noqa: E402
from schemas.task_envelope import TaskEnvelope  # noqa: E402
from services.llm_provider import LLMProvider, get_scoring_provider  # noqa: E402
from services.llm_scorer import score_new_jobs_llm  # noqa: E402
from services.score_queue_service import pop_score_jobs_task  # noqa: E402
from services.score_service import score_new_jobs_for_users  # noqa: E402
from services.worker_base import BaseWorker  # noqa: E402

logger = logging.getLogger("score_worker")


class ScoreWorker(BaseWorker[ScoreJobsTask]):
    def __init__(self) -> None:
        super().__init__("score")
        self._provider: LLMProvider | None = None
        self._use_llm: bool = False

    async def preflight(self) -> bool:
        """Initialize LLM provider once at startup if LLM scoring is enabled."""
        settings = get_settings()
        self._use_llm = settings.scoring_use_llm

        if self._use_llm:
            try:
                self._provider = get_scoring_provider()
                logger.info(
                    "LLM scoring enabled, provider=%s, model=%s",
                    type(self._provider).__name__,
                    settings.scoring_model,
                )
            except Exception:
                logger.exception("Failed to initialize LLM provider, falling back to heuristic")
                self._use_llm = False
        else:
            logger.info("Heuristic scoring mode (scoring_use_llm=False)")

        return True

    async def pop_task(self) -> tuple[TaskEnvelope, ScoreJobsTask] | None:
        return await pop_score_jobs_task()

    async def process_task(self, task: ScoreJobsTask) -> None:
        async with AsyncSessionLocal() as db:
            try:
                if self._use_llm and self._provider is not None:
                    score_stats = await score_new_jobs_llm(
                        db, self._provider, task.job_ids
                    )
                else:
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
    ScoreWorker().run()
