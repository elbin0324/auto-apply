import logging
from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from deps import CurrentUser, DbSession
from models.profile import Education, Experience, Profile, Skill
from schemas.profile import (
    ApplicationPreferences,
    ApplicationPreferencesUpdate,
    EducationCreate,
    EducationResponse,
    ExperienceCreate,
    ExperienceResponse,
    ParsedResume,
    ProfileResponse,
    ProfileUpdate,
    SkillCreate,
    SkillResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])

MAX_RESUME_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"application/pdf"}

_PROFILE_LOAD_OPTIONS = (
    selectinload(Profile.experiences),
    selectinload(Profile.educations),
    selectinload(Profile.skills),
)


async def _get_or_create_profile(db: AsyncSession, user_id: UUID) -> Profile:
    stmt = (
        select(Profile)
        .options(*_PROFILE_LOAD_OPTIONS)
        .where(Profile.user_id == user_id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if profile:
        return profile

    profile = Profile(user_id=user_id)
    db.add(profile)
    await db.flush()

    result = await db.execute(stmt)
    return result.scalar_one()


# ── Profile CRUD ─────────────────────────────────────────────────────────────


@router.get("", response_model=ProfileResponse)
async def get_profile(user: CurrentUser, db: DbSession) -> ProfileResponse:
    profile = await _get_or_create_profile(db, user.id)
    return ProfileResponse.model_validate(profile)


@router.put("", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate, user: CurrentUser, db: DbSession
) -> ProfileResponse:
    profile = await _get_or_create_profile(db, user.id)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.flush()
    return ProfileResponse.model_validate(profile)


# ── Bulk replace sub-collections ─────────────────────────────────────────────


@router.put("/experiences", response_model=list[ExperienceResponse])
async def replace_experiences(
    body: list[ExperienceCreate], user: CurrentUser, db: DbSession
) -> list[ExperienceResponse]:
    profile = await _get_or_create_profile(db, user.id)

    for exp in profile.experiences:
        await db.delete(exp)
    await db.flush()

    new_items: list[Experience] = []
    for item in body:
        exp = Experience(profile_id=profile.id, **item.model_dump())
        db.add(exp)
        new_items.append(exp)
    await db.flush()

    return [ExperienceResponse.model_validate(e) for e in new_items]


@router.put("/education", response_model=list[EducationResponse])
async def replace_education(
    body: list[EducationCreate], user: CurrentUser, db: DbSession
) -> list[EducationResponse]:
    profile = await _get_or_create_profile(db, user.id)

    for edu in profile.educations:
        await db.delete(edu)
    await db.flush()

    new_items: list[Education] = []
    for item in body:
        edu = Education(profile_id=profile.id, **item.model_dump())
        db.add(edu)
        new_items.append(edu)
    await db.flush()

    return [EducationResponse.model_validate(e) for e in new_items]


@router.put("/skills", response_model=list[SkillResponse])
async def replace_skills(
    body: list[SkillCreate], user: CurrentUser, db: DbSession
) -> list[SkillResponse]:
    profile = await _get_or_create_profile(db, user.id)

    for skill in profile.skills:
        await db.delete(skill)
    await db.flush()

    new_items: list[Skill] = []
    for item in body:
        skill = Skill(profile_id=profile.id, **item.model_dump())
        db.add(skill)
        new_items.append(skill)
    await db.flush()

    return [SkillResponse.model_validate(s) for s in new_items]


# ── Application preferences ─────────────────────────────────────────────


@router.get("/preferences", response_model=ApplicationPreferences | None)
async def get_preferences(
    user: CurrentUser, db: DbSession
) -> ApplicationPreferences | None:
    profile = await _get_or_create_profile(db, user.id)
    if not profile.application_preferences:
        return None
    return ApplicationPreferences.model_validate(profile.application_preferences)


@router.put("/preferences", response_model=ApplicationPreferences)
async def update_preferences(
    body: ApplicationPreferencesUpdate, user: CurrentUser, db: DbSession
) -> ApplicationPreferences:
    profile = await _get_or_create_profile(db, user.id)

    existing = profile.application_preferences or {}
    update_data = body.model_dump(exclude_unset=True)

    # Merge custom_answers rather than replacing
    if "custom_answers" in update_data and isinstance(existing.get("custom_answers"), dict):
        merged_custom = {**existing["custom_answers"], **update_data["custom_answers"]}
        update_data["custom_answers"] = merged_custom

    merged = {**existing, **update_data}
    profile.application_preferences = merged
    await db.flush()

    return ApplicationPreferences.model_validate(profile.application_preferences)


# ── Resume upload & parse ────────────────────────────────────────────────────


@router.post("/resume/upload", response_model=ProfileResponse)
async def upload_resume_file(
    file: UploadFile, user: CurrentUser, db: DbSession
) -> ProfileResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only PDF allowed.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {MAX_RESUME_SIZE // (1024 * 1024)} MB.",
        )

    from utils.storage import upload_resume

    profile = await _get_or_create_profile(db, user.id)
    storage_path = upload_resume(user.id, file_bytes)
    profile.raw_resume_url = storage_path
    profile.resume_updated_at = datetime.now(timezone.utc)
    await db.flush()

    return ProfileResponse.model_validate(profile)


@router.post("/resume/parse", response_model=ParsedResume)
async def parse_resume(user: CurrentUser, db: DbSession) -> ParsedResume:
    profile = await _get_or_create_profile(db, user.id)

    if not profile.raw_resume_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resume uploaded. Upload a resume first.",
        )

    from utils.storage import get_resume_signed_url

    signed_url = get_resume_signed_url(profile.raw_resume_url)
    if not signed_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve resume from storage.",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.get(signed_url)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download resume from storage.",
            )
        pdf_bytes = resp.content

    from utils.pdf_parser import extract_text_from_pdf

    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from PDF. The file may be image-based or empty.",
        )

    from services.resume_parser import parse_resume_text

    parsed = await parse_resume_text(raw_text)

    profile.parsed_resume = parsed.model_dump(mode="json")
    await db.flush()

    return parsed


@router.get("/resume/parsed", response_model=ParsedResume)
async def get_parsed_resume(user: CurrentUser, db: DbSession) -> ParsedResume:
    profile = await _get_or_create_profile(db, user.id)

    if not profile.parsed_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No parsed resume found. Upload and parse a resume first.",
        )

    return ParsedResume.model_validate(profile.parsed_resume)
