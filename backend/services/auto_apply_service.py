import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.application import Application
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Profile
from models.subscription import Subscription
from schemas.auto_apply import (
    ApplyTask,
    EducationForAgent,
    ExperienceForAgent,
    QueueStatus,
    SkillForAgent,
    UserProfileForAgent,
)
from schemas.profile import ApplicationPreferences
from services.queue_service import push_apply_task

logger = logging.getLogger(__name__)

SCORE_THRESHOLD = 40


async def get_or_create_config(
    db: AsyncSession, user_id: uuid.UUID
) -> AutoApplyConfig:
    result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.user_id == user_id)
    )
    config = result.scalar_one_or_none()
    if config:
        return config

    config = AutoApplyConfig(user_id=user_id)
    db.add(config)
    await db.flush()
    return config


async def check_credits(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Return credits_remaining, or -1 if no subscription (allow anyway for now)."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        logger.warning(
            "No subscription for user %s — billing not enforced", user_id
        )
        return -1
    return sub.credits_remaining


async def count_applications_today(
    db: AsyncSession, user_id: uuid.UUID
) -> int:
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    result = await db.execute(
        select(func.count(Application.id)).where(
            Application.user_id == user_id,
            Application.created_at >= today_start,
        )
    )
    return result.scalar_one()


async def build_user_profile_for_agent(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[UserProfileForAgent | None, str | None, str | None]:
    """Load profile with relationships and return (profile, resume_text, resume_url).

    Eagerly loads experiences, educations, and skills.
    Extracts raw_text from parsed_resume if available.
    """
    stmt = (
        select(Profile)
        .options(
            selectinload(Profile.experiences),
            selectinload(Profile.educations),
            selectinload(Profile.skills),
        )
        .where(Profile.user_id == user_id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        return None, None, None

    user_profile = UserProfileForAgent(
        full_name=profile.full_name,
        email=profile.email,
        phone=profile.phone,
        location=profile.location,
        linkedin_url=profile.linkedin_url,
        website_url=profile.website_url,
        summary=profile.summary,
        experiences=[
            ExperienceForAgent(
                company=e.company,
                title=e.title,
                location=e.location,
                start_date=e.start_date,
                end_date=e.end_date,
                description=e.description,
                bullets=e.bullets or [],
                sort_order=e.sort_order,
            )
            for e in sorted(profile.experiences, key=lambda x: x.sort_order)
        ],
        educations=[
            EducationForAgent(
                institution=ed.institution,
                degree=ed.degree,
                field_of_study=ed.field_of_study,
                start_date=ed.start_date,
                end_date=ed.end_date,
                gpa=ed.gpa,
                sort_order=ed.sort_order,
            )
            for ed in sorted(profile.educations, key=lambda x: x.sort_order)
        ],
        skills=[
            SkillForAgent(
                name=s.name,
                category=s.category or "technical",
                proficiency=s.proficiency or "intermediate",
            )
            for s in profile.skills
        ],
        application_preferences=(
            ApplicationPreferences.model_validate(profile.application_preferences)
            if profile.application_preferences
            else None
        ),
    )

    resume_text = None
    if profile.parsed_resume and isinstance(profile.parsed_resume, dict):
        resume_text = profile.parsed_resume.get("raw_text")

    return user_profile, resume_text, profile.raw_resume_url


async def run_matching_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    config: AutoApplyConfig,
) -> dict:
    """Match jobs to user config, create Applications, push to queue.

    Returns stats: {matched, queued, skipped_already_applied, skipped_daily_limit, initial_status}
    """
    # 1. Active jobs with pre-computed score above threshold
    stmt = (
        select(Job)
        .join(JobMatchScore, JobMatchScore.job_id == Job.id)
        .where(
            Job.is_active.is_(True),
            JobMatchScore.user_id == user_id,
            JobMatchScore.score >= SCORE_THRESHOLD,
        )
    )

    # 2. Config filters
    if config.location_type_pref:
        stmt = stmt.where(Job.location_type.in_(config.location_type_pref))

    if config.min_salary is not None:
        stmt = stmt.where(
            (Job.salary_min >= config.min_salary) | (Job.salary_min.is_(None))
        )

    if config.max_salary is not None:
        stmt = stmt.where(
            (Job.salary_max <= config.max_salary) | (Job.salary_max.is_(None))
        )

    if config.excluded_companies:
        for company_name in config.excluded_companies:
            stmt = stmt.where(
                ~func.lower(Job.company).contains(company_name.lower())
            )

    stmt = stmt.order_by(JobMatchScore.score.desc())

    result = await db.execute(stmt)
    candidate_jobs = result.scalars().all()

    # 3. Filter out already-applied jobs
    already_applied_ids: set[uuid.UUID] = set()
    if candidate_jobs:
        job_ids = [j.id for j in candidate_jobs]
        existing_result = await db.execute(
            select(Application.job_id).where(
                Application.user_id == user_id,
                Application.job_id.in_(job_ids),
            )
        )
        already_applied_ids = set(existing_result.scalars().all())

    # 4. Daily limit
    applied_today = await count_applications_today(db, user_id)
    remaining_today = max(0, config.daily_apply_limit - applied_today)

    # 5. Load profile for agent context
    user_profile, resume_text, resume_url = await build_user_profile_for_agent(
        db, user_id
    )

    # 6. Create Applications and push tasks
    initial_status = "pending_review" if config.require_review else "queued"
    queued_count = 0
    skipped_already = 0
    skipped_limit = 0

    for job in candidate_jobs:
        if job.id in already_applied_ids:
            skipped_already += 1
            continue
        if queued_count >= remaining_today:
            skipped_limit += 1
            continue

        application = Application(
            user_id=user_id,
            job_id=job.id,
            status=initial_status,
            resume_used_url=resume_url,
        )
        db.add(application)
        await db.flush()

        if not config.require_review:
            task = ApplyTask(
                application_id=application.id,
                user_id=user_id,
                job_id=job.id,
                job_url=job.url,
                resume_url=resume_url,
                resume_text=resume_text,
                user_profile=user_profile,
            )
            await push_apply_task(task)

        queued_count += 1

    logger.info(
        "Matching for user %s: matched=%d queued=%d skipped_applied=%d skipped_limit=%d",
        user_id,
        len(candidate_jobs),
        queued_count,
        skipped_already,
        skipped_limit,
    )

    return {
        "matched": len(candidate_jobs),
        "queued": queued_count,
        "skipped_already_applied": skipped_already,
        "skipped_daily_limit": skipped_limit,
        "initial_status": initial_status,
    }


async def get_queue_status(
    db: AsyncSession, user_id: uuid.UUID
) -> QueueStatus:
    pending_result = await db.execute(
        select(func.count(Application.id)).where(
            Application.user_id == user_id,
            Application.status == "pending_review",
        )
    )
    pending_review_count = pending_result.scalar_one()

    in_progress_result = await db.execute(
        select(func.count(Application.id)).where(
            Application.user_id == user_id,
            Application.status == "in_progress",
        )
    )
    in_progress_count = in_progress_result.scalar_one()

    queued_result = await db.execute(
        select(func.count(Application.id)).where(
            Application.user_id == user_id,
            Application.status == "queued",
        )
    )
    queue_depth = queued_result.scalar_one()

    return QueueStatus(
        queue_depth=queue_depth,
        pending_review_count=pending_review_count,
        in_progress_count=in_progress_count,
    )
