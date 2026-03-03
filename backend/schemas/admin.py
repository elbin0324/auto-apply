"""Schemas for the admin panel endpoints."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AdminUserSummary(BaseModel):
    """User row with profile and application summary for admin list."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: str
    created_at: datetime
    has_profile: bool
    full_name: str | None = None
    application_count: int = 0
    applied_count: int = 0
    auto_apply_active: bool = False


class AdminUserListResponse(BaseModel):
    users: list[AdminUserSummary]
    total: int
    page: int
    per_page: int


class QueueDepths(BaseModel):
    score_jobs: int
    apply: int
    enrich: int


class AdminOverview(BaseModel):
    """System-wide statistics for the admin dashboard."""

    user_count: int
    job_count: int
    active_job_count: int
    application_counts: dict[str, int]
    total_applications: int
    queue_depths: QueueDepths


class AdminQueueStatus(BaseModel):
    """Queue status for monitoring."""

    score_jobs_queue_depth: int
    apply_queue_depth: int
    enrich_queue_depth: int


class WipeResult(BaseModel):
    """Result of a bulk wipe operation."""

    affected: int
    action: str  # "soft_delete" or "hard_delete"


class WorkerStatus(BaseModel):
    """Heartbeat data for a single worker instance."""

    name: str
    worker_id: str | None = None
    started_at: str | None = None
    last_beat_at: str | None = None
    tasks_processed: int = 0
    tasks_failed: int = 0
    current_task: str = ""
    status: str = "offline"  # "idle", "processing", "offline"
    is_alive: bool = False


class WorkersOverview(BaseModel):
    workers: list[WorkerStatus]


class TriggerResult(BaseModel):
    """Response from a manual trigger action."""

    triggered: str
    detail: str


class QueuePurgeResult(BaseModel):
    purged: int
    queue: str


class DLQItem(BaseModel):
    """A single dead-letter queue entry."""

    envelope: dict
    error: str
    failed_at: str


class DLQStatus(BaseModel):
    """Status of a single DLQ."""

    queue_name: str
    depth: int
    items: list[DLQItem] = []


class DLQOverview(BaseModel):
    """Depths of all DLQs."""

    queues: dict[str, int]
    total: int


class DLQReplayResult(BaseModel):
    replayed: bool
    queue_name: str
