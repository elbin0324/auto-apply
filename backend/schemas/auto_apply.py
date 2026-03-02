from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.profile import (
    ApplicationPreferences,
    EducationCreate,
    ExperienceCreate,
    SkillCreate,
)

# Aliases matching apply-agents naming (same schema, clearer intent)
ExperienceForAgent = ExperienceCreate
EducationForAgent = EducationCreate
SkillForAgent = SkillCreate


# ── User profile payload sent to agent workers ──────────────────────────────


class UserProfileForAgent(BaseModel):
    """Applicant profile context included in ApplyTask for the Application Agent.

    Must stay in sync with apply-agents: models/task.py UserProfileForAgent.
    """

    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None
    experiences: list[ExperienceForAgent] = []
    educations: list[EducationForAgent] = []
    skills: list[SkillForAgent] = []
    application_preferences: ApplicationPreferences | None = None


# ── Auto-apply config ───────────────────────────────────────────────────────


class AutoApplyConfigUpdate(BaseModel):
    target_titles: list[str] | None = None
    target_locations: list[str] | None = None
    min_salary: float | None = None
    max_salary: float | None = None
    excluded_companies: list[str] | None = None
    preferred_industries: list[str] | None = None
    location_type_pref: list[str] | None = None  # remote, hybrid, onsite
    experience_level: str | None = None  # entry, mid, senior, lead
    daily_apply_limit: int | None = Field(default=None, ge=1, le=100)
    require_review: bool | None = None


class AutoApplyConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    is_active: bool
    target_titles: list[str] | None = None
    target_locations: list[str] | None = None
    min_salary: float | None = None
    max_salary: float | None = None
    excluded_companies: list[str] | None = None
    preferred_industries: list[str] | None = None
    location_type_pref: list[str] | None = None
    experience_level: str | None = None
    daily_apply_limit: int = 25
    require_review: bool = False


class AutoApplyStatus(BaseModel):
    is_active: bool
    jobs_matched_today: int
    applications_sent_today: int
    credits_remaining: int
    daily_limit: int


class QueueStatus(BaseModel):
    queue_depth: int
    pending_review_count: int
    in_progress_count: int


class ApplyTask(BaseModel):
    """Message pushed to Redis queue for agent workers.

    Must stay in sync with apply-agents: models/task.py ApplyTask.
    """

    application_id: UUID
    user_id: UUID
    job_id: UUID
    job_url: str
    resume_url: str | None = None
    resume_text: str | None = None
    cover_letter: str | None = None
    user_profile: UserProfileForAgent | None = None


class ApplyResult(BaseModel):
    """Result posted back by agent workers."""

    application_id: UUID
    success: bool
    screenshot_url: str | None = None
    error_message: str | None = None
    metadata: dict = {}
