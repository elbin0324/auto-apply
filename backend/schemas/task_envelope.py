"""Standard envelope wrapping all queue messages.

Provides correlation IDs, retry tracking, and metadata for every
task flowing through the Redis queues.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class TaskEnvelope(BaseModel):
    """Wrapper for any queue task payload.

    The ``payload`` field contains the serialized inner task (ScoreJobsTask,
    EnrichJobsTask, FetchJobsTask, etc.) as a JSON string.  This avoids type
    coupling while providing consistent metadata across all queues.
    """

    task_id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    retry_count: int = 0
    max_retries: int = 3
    source_worker: str = "api"  # Legacy — use ``source`` for new code
    queue_name: str = ""
    payload: str  # JSON-serialized inner task

    # ── New fields (all optional with defaults for backward compat) ───────
    task_type: str = ""  # "fetch_jobs" | "score_jobs" | "enrich_jobs"
    user_id: str = ""  # UUID as string; enables per-user queue monitoring
    correlation_id: str = ""  # Links fetch → score → enrich task chain
    source: str = ""  # "cron_daily" | "onboarding" | "auto_apply_start" | "config_update" | "admin_trigger" | "user_rescore" | "admin_rescore" | "job_fetch" | "adzuna_sync" | "score_worker"

    def increment_retry(self) -> "TaskEnvelope":
        """Return a copy with retry_count incremented."""
        return self.model_copy(update={"retry_count": self.retry_count + 1})
