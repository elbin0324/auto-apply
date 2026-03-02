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
    crawl: int
    score_jobs: int
    score_users: int
    apply: int


class AdminOverview(BaseModel):
    """System-wide statistics for the admin dashboard."""

    user_count: int
    job_count: int
    active_job_count: int
    company_count: int
    active_company_count: int
    application_counts: dict[str, int]
    total_applications: int
    queue_depths: QueueDepths


class AdminQueueStatus(BaseModel):
    """Extended queue status with dedup key counts."""

    crawl_queue_depth: int
    score_jobs_queue_depth: int
    score_users_queue_depth: int
    apply_queue_depth: int
    crawl_dedup_keys: int


class WipeResult(BaseModel):
    """Result of a bulk wipe operation."""

    affected: int
    action: str  # "soft_delete" or "hard_delete"
