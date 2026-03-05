"""Schemas for the job enrichment pipeline."""

from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from schemas.base_task import BaseTask


class EnrichJobsTask(BaseTask):
    """Pushed to enrich:jobs queue after scoring completes."""

    TASK_TYPE: ClassVar[str] = "enrich_jobs"
    QUEUE_NAME: ClassVar[str] = "enrich:jobs"

    job_ids: list[UUID]
    user_id: UUID | None = None  # Optional user context for monitoring

    def log_summary(self) -> dict:
        summary: dict = {"job_count": len(self.job_ids)}
        if self.user_id:
            summary["user_id"] = str(self.user_id)
        return summary


class SalaryExtracted(BaseModel):
    """Salary information extracted from job description text."""

    min: float | None = None
    max: float | None = None
    currency: str = "USD"
    type: str = "annual"  # annual, hourly, monthly

    @field_validator("currency", mode="before")
    @classmethod
    def currency_not_none(cls, v: object) -> object:
        return v if v is not None else "USD"

    @field_validator("type", mode="before")
    @classmethod
    def type_not_none(cls, v: object) -> object:
        return v if v is not None else "annual"


class EnrichedJobData(BaseModel):
    """Structured data extracted from a job description by the LLM.

    Validated from the JSON returned by Claude.
    """

    experience_level: str | None = None  # entry, mid, senior, lead, executive
    employment_type: str | None = None  # full_time, part_time, contract, internship
    years_experience_min: int | None = None
    years_experience_max: int | None = None
    description_clean: str | None = None

    # Rich structured data stored in requirements JSONB
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    education: str | None = None
    benefits: list[str] = Field(default_factory=list)
    visa_sponsorship: bool | None = None
    salary_mentioned: SalaryExtracted | None = None
    key_responsibilities: list[str] = Field(default_factory=list)


class EnrichmentStats(BaseModel):
    """Stats returned after enriching a batch of jobs."""

    jobs_enriched: int = 0
    jobs_skipped: int = 0
    jobs_failed: int = 0
    salary_backfills: int = 0
