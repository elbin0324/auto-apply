from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExperienceCreate(BaseModel):
    company: str
    title: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    bullets: list[str] = []
    sort_order: int = 0


class ExperienceResponse(ExperienceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    profile_id: UUID


class EducationCreate(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    gpa: str | None = None
    sort_order: int = 0


class EducationResponse(EducationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    profile_id: UUID


class SkillCreate(BaseModel):
    name: str
    category: str = "technical"
    proficiency: str = "intermediate"


class SkillResponse(SkillCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    profile_id: UUID


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None
    raw_resume_url: str | None = None
    resume_updated_at: datetime | None = None
    experiences: list[ExperienceResponse] = []
    educations: list[EducationResponse] = []
    skills: list[SkillResponse] = []


class ParsedResume(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None
    experiences: list[ExperienceCreate] = []
    educations: list[EducationCreate] = []
    skills: list[SkillCreate] = []
    raw_text: str = ""
