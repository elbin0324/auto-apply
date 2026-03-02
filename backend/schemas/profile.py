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


# ── Application preferences (screening question answers) ─────────────────


class ApplicationPreferences(BaseModel):
    """Pre-set answers to common job application screening questions.

    Structured fields for high-confidence matching on standard questions,
    plus custom_answers dict for the long tail.
    """

    # Work authorization
    authorized_us: bool | None = None
    authorized_ca: bool | None = None
    requires_sponsorship: bool | None = None

    # Availability
    willing_to_relocate: bool | None = None
    earliest_start_date: date | None = None
    notice_period_days: int | None = None

    # Compensation
    desired_salary_min: int | None = None
    desired_salary_max: int | None = None
    salary_currency: str = "USD"

    # Legal / background
    over_18: bool | None = None
    has_drivers_license: bool | None = None
    felony_conviction: bool | None = None

    # Referral
    how_did_you_hear: str | None = None

    # Catch-all for custom Q&A — keys are question patterns, values are answers
    custom_answers: dict[str, str] = {}


class ApplicationPreferencesUpdate(BaseModel):
    """Partial update for application preferences. All fields optional."""

    authorized_us: bool | None = None
    authorized_ca: bool | None = None
    requires_sponsorship: bool | None = None
    willing_to_relocate: bool | None = None
    earliest_start_date: date | None = None
    notice_period_days: int | None = None
    desired_salary_min: int | None = None
    desired_salary_max: int | None = None
    salary_currency: str | None = None
    over_18: bool | None = None
    has_drivers_license: bool | None = None
    felony_conviction: bool | None = None
    how_did_you_hear: str | None = None
    custom_answers: dict[str, str] | None = None


# ── Profile ──────────────────────────────────────────────────────────────


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
    application_preferences: ApplicationPreferences | None = None
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
