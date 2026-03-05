"""Score worker — polls score:jobs queue, runs LLM-based or heuristic scoring.

Run with: cd backend && poetry run python -m workers.score

When scoring_use_llm=True (default), scores jobs via batched LLM calls.
When scoring_use_llm=False, falls back to heuristic skill/title/location matching.
"""

import logging

from config import get_settings
from db.session import AsyncSessionLocal
from schemas.queue_tasks import ScoreJobsTask
from schemas.task_envelope import TaskEnvelope
from workers.base import BaseWorker
from workers.queues.score import pop_score_jobs_task
from workers.services.heuristic_scorer import score_new_jobs_for_user
from workers.services.llm_provider import LLMProvider, get_scoring_provider
from workers.services.llm_scorer import score_new_jobs_llm

logger = logging.getLogger("score_worker")


class ScoreWorker(BaseWorker[ScoreJobsTask]):
    queue_name = "score:jobs"

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

    async def process_task(self, task: ScoreJobsTask, envelope: TaskEnvelope) -> None:
        async with AsyncSessionLocal() as db:
            try:
                if self._use_llm and self._provider is not None:
                    score_stats = await score_new_jobs_llm(
                        db, self._provider, task.user_id, force=task.force
                    )
                else:
                    score_stats = await score_new_jobs_for_user(
                        db, task.user_id, force=task.force
                    )
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Scoring failed for user %s", task.user_id)
                raise

        logger.info("Score jobs complete: user=%s, %s", task.user_id, score_stats)

    def task_label(self, task: ScoreJobsTask) -> str:
        return f"user:{task.user_id}"


if __name__ == "__main__":
    ScoreWorker().run()
