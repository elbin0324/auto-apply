"""Schemas for the job enrichment pipeline."""

from uuid import UUID

from pydantic import BaseModel, Field


class EnrichJobsTask(BaseModel):
    """Pushed to enrich:jobs queue after a crawl completes."""

    company_id: UUID
    job_ids: list[UUID]


class SalaryExtracted(BaseModel):
    """Salary information extracted from job description text."""

    min: float | None = None
    max: float | None = None
    currency: str = "USD"
    type: str = "annual"  # annual, hourly, monthly


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
