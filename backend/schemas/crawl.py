"""Schemas for the crawl and scoring task queues."""

from uuid import UUID

from pydantic import BaseModel, Field


class CrawlTask(BaseModel):
    """Pushed to crawl:companies queue by the scheduler."""

    company_id: UUID
    company_slug: str
    ats_type: str
    priority: int = Field(default=0, description="Higher = process first")


class ScoreJobsTask(BaseModel):
    """Pushed to score:jobs queue after a crawl completes."""

    company_id: UUID
    job_ids: list[UUID]


class ScoreUserTask(BaseModel):
    """Pushed to score:users queue when a user profile changes."""

    user_id: UUID
    reason: str = "profile_update"  # profile_update, auto_apply_enabled, scheduled_rescore


class CrawlQueueStatus(BaseModel):
    """Status of all processing queues."""

    crawl_queue_depth: int
    score_jobs_queue_depth: int
    score_users_queue_depth: int
    apply_queue_depth: int


class EmbeddingStats(BaseModel):
    """Embedding coverage statistics."""

    jobs_total: int
    jobs_embedded: int
    profiles_total: int
    profiles_embedded: int
