from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas.job import JobResponse


class ApplicationStatus(StrEnum):
    QUEUED = "queued"
    PENDING_REVIEW = "pending_review"
    IN_PROGRESS = "in_progress"
    APPLIED = "applied"
    FAILED = "failed"
    SKIPPED = "skipped"
    WITHDRAWN = "withdrawn"


class ApplicationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    job_id: UUID | None = None
    status: ApplicationStatus
    applied_at: datetime | None = None
    resume_used_url: str | None = None
    cover_letter_used: str | None = None
    screenshot_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    job: JobResponse | None = None


class ApplicationListResponse(BaseModel):
    applications: list[ApplicationDetail]
    total: int
    page: int
    per_page: int
    pages: int


class ApplicationStats(BaseModel):
    total: int
    applied: int
    pending: int
    failed: int
    skipped: int
    this_week: int
    success_rate: float  # applied / (applied + failed) * 100
