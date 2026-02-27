from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class JobSearchParams(BaseModel):
    query: str | None = None
    location: str | None = None
    location_type: list[str] | None = None  # remote, hybrid, onsite
    salary_min: float | None = None
    category: str | None = None
    page: int = 1
    per_page: int = 20
    sort_by: str = "posted_at"  # posted_at, salary


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
    tags: list[str] = []
    url: str
    source: str = "adzuna"
    category: str | None = None
    posted_at: datetime | None = None
    is_active: bool = True
    match_score: float | None = None  # computed per-user, not stored


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    per_page: int
    pages: int
