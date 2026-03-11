"""Dashboard summary schemas."""

from pydantic import BaseModel

from schemas.application import ApplicationDetail


class DashboardStats(BaseModel):
    total: int
    applied: int
    pending_review: int
    queued: int
    in_progress: int
    failed: int
    skipped: int
    this_week: int
    today: int
    success_rate: float
    avg_match_score: float | None


class DashboardQueue(BaseModel):
    queue_depth: int
    pending_review_count: int
    in_progress_count: int


class ATSBreakdown(BaseModel):
    ats_name: str
    display_name: str
    application_count: int
    success_rate: float


class DashboardSummary(BaseModel):
    stats: DashboardStats
    queue: DashboardQueue
    recent_applications: list[ApplicationDetail]
    ats_breakdown: list[ATSBreakdown]
