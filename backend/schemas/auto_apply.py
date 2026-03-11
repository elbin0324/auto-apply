from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.profile import (
    ApplicationPreferences,
    EducationCreate,
    ExperienceCreate,
    SkillCreate,
)

TaskMode = Literal["full_auto", "extract_only", "fill_and_submit"]

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
    employment_type_pref: list[str] | None = None  # full_time, part_time, contract, internship
    experience_level: str | None = None  # entry, mid, senior, lead, executive
    daily_apply_limit: int | None = Field(default=None, ge=1, le=100)
    apply_mode: str | None = Field(default=None, pattern="^(safe|hybrid|auto)$")
    auto_apply_threshold: int | None = Field(default=None, ge=15, le=100)


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
    employment_type_pref: list[str] | None = None
    experience_level: str | None = None
    daily_apply_limit: int = 25
    apply_mode: str = "safe"
    auto_apply_threshold: int = 70


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

    Must stay in sync with application-runner task schema.
    Serializes application_id as task_id for the runner via alias.
    """

    model_config = ConfigDict(populate_by_name=True)

    application_id: UUID = Field(
        validation_alias="task_id",
        serialization_alias="task_id",
    )
    user_id: UUID
    job_id: UUID
    job_url: str
    resume_url: str | None = None
    resume_text: str | None = None
    cover_letter: str | None = None
    user_profile: UserProfileForAgent | None = None
    mode: TaskMode = "full_auto"
    provided_answers: dict[str, str] | None = None


# ── Progress & Generated Application schemas ─────────────────────────────


class ProgressUpdate(BaseModel):
    """Progress update posted by runner during task execution."""

    task_id: str  # maps to application_id
    phase: str  # navigating, extracting, answering, filling, submitting, completed, failed
    message: str = ""
    timestamp: datetime | None = None
    payload: dict = {}


class GeneratedApplicationField(BaseModel):
    name: str
    label: str
    field_type: str
    options: list[dict] = []
    is_required: bool = False
    page_number: int = 1


class GeneratedApplicationAnswer(BaseModel):
    field_name: str
    value: str
    source: str = "generated"


class GeneratedApplication(BaseModel):
    task_id: str | None = None
    job_url: str | None = None
    ats_name: str | None = None
    fields: list[GeneratedApplicationField] = []
    answers: list[GeneratedApplicationAnswer] = []
    pages_found: int = 1
    created_at: datetime | None = None


class SubmitAnswersRequest(BaseModel):
    """Request body for submitting reviewed answers."""

    answers: dict[str, str]  # field_name → value


class BatchReviewRequest(BaseModel):
    """Request body for batch review of applications."""

    application_ids: list[UUID]
    action: str = Field(pattern="^(approve|reject)$")


class BatchReviewItemResult(BaseModel):
    application_id: str
    status: str


class BatchReviewResponse(BaseModel):
    processed: int
    results: list[BatchReviewItemResult]
    errors: list[dict]


# ── Agent result ─────────────────────────────────────────────────────────


class ApplyResult(BaseModel):
    """Result posted back by agent workers.

    Accepts both the runner format (task_id + status string) and the
    legacy format (application_id + success bool) for backwards compat.
    """

    model_config = ConfigDict(populate_by_name=True)

    application_id: UUID = Field(alias="task_id")
    status: str  # "success", "failed", "needs_review"
    screenshot_urls: list[str] = []
    reason: str | None = None  # runner's error reason
    # Legacy fields (optional, for backwards compat)
    screenshot_url: str | None = None
    error_message: str | None = None
    metadata: dict = {}
    generated_application: GeneratedApplication | None = None

    @property
    def success(self) -> bool:
        return self.status == "success"
