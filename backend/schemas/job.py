from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AISalary(BaseModel):
    currency: str | None = None
    min_value: float | None = None
    max_value: float | None = None
    unit_text: str | None = None


class AIEnrichment(BaseModel):
    skills: list[str] = []
    core_responsibilities: str | None = None
    requirements_summary: str | None = None
    benefits: list[str] | str | None = None
    keywords: list[str] = []
    taxonomies: list[str] = []
    education_level: list[str] = []
    visa_sponsorship: bool | None = None
    working_hours: int | None = None
    job_language: str | None = None
    hiring_manager_name: str | None = None
    hiring_manager_email: str | None = None
    work_arrangement_office_days: int | None = None
    remote_location: list[str] | str | None = None
    salary: AISalary | None = None


class JobSearchParams(BaseModel):
    query: str | None = None
    location: str | None = None
    location_type: list[str] | None = None  # remote, hybrid, onsite
    salary_min: float | None = None
    category: str | None = None
    experience_level: list[str] | None = None  # entry, mid, senior, lead, executive
    employment_type: list[str] | None = None  # full_time, part_time, contract, internship
    page: int = 1
    per_page: int = 20
    status: str | None = None  # new, pending_review, queued, applied, skipped
    sort_by: str = "posted_at"  # posted_at, salary, match_score


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    external_id: str | None = None
    title: str
    company: str | None = None
    company_logo_url: str | None = None
    location: str | None = None
    location_type: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str = "CAD"
    description: str | None = None
    description_clean: str | None = None
    requirements: dict | None = None
    experience_level: str | None = None
    employment_type: str | None = None
    years_experience_min: int | None = None
    years_experience_max: int | None = None
    enriched_at: datetime | None = None
    tags: list[str] = []
    url: str
    apply_url: str | None = None
    source: str = "adzuna"
    source_domain: str | None = None
    ats_platform: str | None = None
    organization_url: str | None = None
    domain_derived: str | None = None
    country: str | None = None
    city: str | None = None
    ai_enrichment: AIEnrichment | None = None
    category: str | None = None
    posted_at: datetime | None = None
    is_active: bool = True
    match_score: float | None = None  # computed per-user, not stored
    match_factors: dict | None = None  # scoring breakdown
    application_status: str | None = None  # null = "new", else Application.status
    application_id: str | None = None  # UUID of Application row if exists


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    per_page: int
    pages: int
