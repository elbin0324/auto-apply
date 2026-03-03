"""Heuristic scoring service — scores jobs against users using skill/title/location matching.

After scoring, pushes top-N un-enriched jobs to the enrich queue for
selective LLM enrichment.
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import get_settings
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Profile
from models.user import User
from schemas.enrichment import EnrichJobsTask
from services.enrich_queue_service import push_enrich_task
from services.job_matcher import score_job_for_user

logger = logging.getLogger(__name__)


async def _load_active_users(
    db: AsyncSession,
) -> list[User]:
    """Load active users who have a profile."""
    result = await db.execute(
        select(User)
        .join(AutoApplyConfig, User.id == AutoApplyConfig.user_id)
        .join(Profile, User.id == Profile.user_id)
        .where(AutoApplyConfig.is_active.is_(True))
        .options(
            selectinload(User.profile).selectinload(Profile.skills),
            selectinload(User.auto_apply_config),
        )
    )
    return list(result.unique().scalars().all())


async def score_new_jobs_for_users(
    db: AsyncSession,
    job_ids: list[uuid.UUID],
) -> dict:
    """Score new/updated jobs against all active users using heuristic matching.

    For each active user, compute skill/title/location scores for the new jobs,
    upsert JobMatchScore rows, then push top-N un-enriched jobs to enrich queue.
    """
    settings = get_settings()
    users = await _load_active_users(db)

    if not users:
        return {"users_checked": 0, "scores_upserted": 0}

    # Load the specific jobs
    jobs_result = await db.execute(
        select(Job).where(
            Job.id.in_(job_ids),
            Job.is_active.is_(True),
        )
    )
    jobs = list(jobs_result.scalars().all())

    if not jobs:
        return {"users_checked": len(users), "scores_upserted": 0, "jobs_available": 0}

    total_upserted = 0
    now = datetime.now(timezone.utc)

    # Track top-scoring jobs to enrich across all users
    jobs_to_enrich: set[uuid.UUID] = set()

    for user in users:
        profile = user.profile
        config = user.auto_apply_config
        if not profile:
            continue

        skill_names = [s.name for s in (profile.skills or [])]
        target_titles = list(config.target_titles or []) if config else []
        target_locations = list(config.target_locations or []) if config else []

        score_rows = []
        scored_jobs: list[tuple[float, uuid.UUID]] = []

        for job in jobs:
            heuristic_score, factors = score_job_for_user(
                skill_names=skill_names,
                target_titles=target_titles,
                profile_location=profile.location,
                target_locations=target_locations,
                job_title=job.title or "",
                job_description=job.description,
                job_location=job.location,
                job_location_type=job.location_type,
            )

            if heuristic_score >= settings.score_min_threshold:
                score_rows.append({
                    "user_id": user.id,
                    "job_id": job.id,
                    "score": heuristic_score,
                    "factors": {
                        **factors,
                        "combined_method": "heuristic",
                    },
                    "computed_at": now,
                })
                scored_jobs.append((heuristic_score, job.id))

        if score_rows:
            stmt = pg_insert(JobMatchScore).values(score_rows)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_job_match_scores_user_job",
                set_={
                    "score": stmt.excluded.score,
                    "factors": stmt.excluded.factors,
                    "computed_at": stmt.excluded.computed_at,
                },
            )
            await db.execute(stmt)
            total_upserted += len(score_rows)

        # Select top N scoring jobs for this user to enrich
        scored_jobs.sort(reverse=True)
        top_n = settings.fantastic_top_n_to_enrich
        for _score, job_id in scored_jobs[:top_n]:
            jobs_to_enrich.add(job_id)

    # Push un-enriched jobs to enrich queue
    if jobs_to_enrich:
        unenriched_result = await db.execute(
            select(Job.id).where(
                Job.id.in_(list(jobs_to_enrich)),
                Job.enriched_at.is_(None),
                Job.description.isnot(None),
            )
        )
        unenriched_ids = list(unenriched_result.scalars().all())

        if unenriched_ids:
            enrich_task = EnrichJobsTask(job_ids=unenriched_ids)
            await push_enrich_task(enrich_task, source="score_worker")
            logger.info("Pushed %d un-enriched jobs to enrich queue", len(unenriched_ids))

    logger.info(
        "Scored %d jobs for %d users, upserted %d scores",
        len(jobs),
        len(users),
        total_upserted,
    )
    return {
        "users_checked": len(users),
        "jobs_scored": len(jobs),
        "scores_upserted": total_upserted,
        "jobs_queued_for_enrichment": len(jobs_to_enrich),
    }
