"""Schemas for queue task payloads and queue status."""

from typing import ClassVar
from uuid import UUID

from schemas.base_task import BaseTask


class FetchJobsTask(BaseTask):
    """Pushed to fetch:jobs queue. Triggers job fetching for a single user."""

    TASK_TYPE: ClassVar[str] = "fetch_jobs"
    QUEUE_NAME: ClassVar[str] = "fetch:jobs"

    user_id: UUID
    recent_only: bool = False  # True = 24h endpoint, False = 7d endpoint

    def log_summary(self) -> dict:
        return {"user_id": str(self.user_id), "recent_only": self.recent_only}


class ScoreJobsTask(BaseTask):
    """Pushed to score:jobs queue. Per-user scoring task."""

    TASK_TYPE: ClassVar[str] = "score_jobs"
    QUEUE_NAME: ClassVar[str] = "score:jobs"

    user_id: UUID
    force: bool = False  # True = clear existing scores and rescore all

    def log_summary(self) -> dict:
        return {"user_id": str(self.user_id), "force": self.force}
