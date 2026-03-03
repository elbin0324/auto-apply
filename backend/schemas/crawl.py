"""Schemas for the scoring task queue."""

from uuid import UUID

from pydantic import BaseModel


class ScoreJobsTask(BaseModel):
    """Pushed to score:jobs queue after job fetch."""

    job_ids: list[UUID]


class QueueStatus(BaseModel):
    """Status of processing queues."""

    score_jobs_queue_depth: int
    apply_queue_depth: int
    enrich_queue_depth: int = 0
