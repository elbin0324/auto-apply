from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


VALID_ATS_TYPES = ["greenhouse", "lever", "ashby", "smartrecruiters", "workday"]


class CompanyCreate(BaseModel):
    name: str
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9\-]*$")
    ats_type: str = Field(description="One of: greenhouse, lever, ashby, smartrecruiters, workday")
    board_token: str
    career_page_url: str | None = None
    ats_base_url: str | None = None
    logo_url: str | None = None
    industry: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = None
    ats_type: str | None = None
    board_token: str | None = None
    career_page_url: str | None = None
    ats_base_url: str | None = None
    logo_url: str | None = None
    industry: str | None = None
    is_active: bool | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    ats_type: str
    board_token: str
    career_page_url: str | None = None
    ats_base_url: str | None = None
    logo_url: str | None = None
    industry: str | None = None
    is_active: bool = True
    last_crawled_at: datetime | None = None
    job_count: int = 0


class CompanyListResponse(BaseModel):
    companies: list[CompanyResponse]
    total: int


class CompanySuggest(BaseModel):
    """User-facing: suggest a company to add to the registry."""
    name: str
    career_page_url: str


class ATSDetectResult(BaseModel):
    ats_type: str | None = None
    board_token: str | None = None
    ats_base_url: str | None = None
    confidence: str = "unknown"  # high, medium, low, unknown
