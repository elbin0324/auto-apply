"""Heuristic scoring service — scores jobs against a single user using skill/title/location matching."""

import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.job_match_score import JobMatchScore
from workers.services.job_filter import (
    filter_candidate_jobs,
    get_unscored_job_ids,
    load_user_with_profile,
)

logger = logging.getLogger(__name__)


# ── Pure scoring functions ────────────────────────────────────────────────────


def _tokenize(text: str | None) -> set[str]:
    if not text:
        return set()
    return set(re.findall(r"[a-z0-9#+.]+", text.lower()))


def _compute_skill_score(user_skills: list[str], job_text: str) -> float:
    """0–50 pts: fraction of user skills found in job text."""
    if not user_skills:
        return 0.0
    job_tokens = _tokenize(job_text)
    matched = sum(1 for skill in user_skills if skill.lower().strip() in job_tokens)
    return (matched / len(user_skills)) * 50.0


def _compute_title_score(target_titles: list[str], job_title: str) -> float:
    """0–30 pts: best Jaccard overlap between any target title and the job title."""
    if not target_titles or not job_title:
        return 0.0
    job_tokens = _tokenize(job_title)
    best = 0.0
    for title in target_titles:
        target_tokens = _tokenize(title)
        if not target_tokens:
            continue
        union = target_tokens | job_tokens
        intersection = target_tokens & job_tokens
        ratio = len(intersection) / len(union) if union else 0.0
        best = max(best, ratio)
    return best * 30.0


def _compute_location_score(
    profile_location: str | None,
    target_locations: list[str] | None,
    job_location: str | None,
    job_location_type: str | None,
) -> float:
    """0–20 pts: remote always matches; else check location string overlap."""
    if job_location_type and "remote" in job_location_type.lower():
        return 20.0
    if not job_location:
        return 0.0
    job_loc_lower = job_location.lower()

    if target_locations:
        for loc in target_locations:
            if loc and loc.lower() in job_loc_lower:
                return 20.0

    if profile_location:
        user_words = _tokenize(profile_location)
        job_words = _tokenize(job_location)
        if user_words & job_words:
            return 20.0

    return 0.0


def score_job_for_user(
    skill_names: list[str],
    target_titles: list[str],
    profile_location: str | None,
    target_locations: list[str] | None,
    job_title: str,
    job_description: str | None,
    job_location: str | None,
    job_location_type: str | None,
) -> tuple[float, dict]:
    """Compute 0–100 heuristic score for one user × job pair."""
    job_text = f"{job_title} {job_description or ''}"

    skill_score = _compute_skill_score(skill_names, job_text)
    title_score = _compute_title_score(target_titles, job_title)
    location_score = _compute_location_score(
        profile_location,
        target_locations,
        job_location,
        job_location_type,
    )

    total = round(skill_score + title_score + location_score, 2)
    factors = {
        "skill_score": round(skill_score, 2),
        "title_score": round(title_score, 2),
        "location_score": round(location_score, 2),
    }
    return total, factors


# ── Bulk scoring ─────────────────────────────────────────────────────────────


async def score_new_jobs_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    force: bool = False,
) -> dict:
    """Score jobs for a single user using heuristic matching.

    1. Load user with profile/config
    2. Pre-filter candidate jobs by user preferences
    3. Exclude already-scored jobs (unless force=True)
    4. Heuristic score the remaining jobs
    5. Upsert scores to DB
    """
    settings = get_settings()

    user = await load_user_with_profile(db, user_id)
    if not user:
        logger.warning("User %s not found or missing profile/config, skipping", user_id)
        return {"jobs_scored": 0, "scores_upserted": 0}

    profile = user.profile
    config = user.auto_apply_config
    if not profile:
        return {"jobs_scored": 0, "scores_upserted": 0}

    jobs = await filter_candidate_jobs(db, config)
    if not jobs:
        return {"jobs_filtered": 0, "jobs_scored": 0, "scores_upserted": 0}

    job_ids = [j.id for j in jobs]

    if force:
        await db.execute(
            delete(JobMatchScore).where(
                JobMatchScore.user_id == user_id,
                JobMatchScore.job_id.in_(job_ids),
            )
        )
        jobs_to_score = jobs
    else:
        unscored_ids = await get_unscored_job_ids(db, user_id, job_ids)
        if not unscored_ids:
            return {
                "jobs_filtered": len(jobs),
                "jobs_scored": 0,
                "scores_upserted": 0,
                "all_already_scored": True,
            }
        unscored_set = set(unscored_ids)
        jobs_to_score = [j for j in jobs if j.id in unscored_set]

    skill_names = [s.name for s in (profile.skills or [])]
    target_titles = list(config.target_titles or [])
    target_locations = list(config.target_locations or [])
    now = datetime.now(timezone.utc)

    score_rows = []
    for job in jobs_to_score:
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

    total_upserted = 0
    if score_rows:
        stmt = pg_insert(JobMatchScore).values(score_rows)
        if force:
            stmt = stmt.on_conflict_do_update(
                constraint="uq_job_match_scores_user_job",
                set_={
                    "score": stmt.excluded.score,
                    "factors": stmt.excluded.factors,
                    "computed_at": stmt.excluded.computed_at,
                },
            )
        else:
            stmt = stmt.on_conflict_do_nothing(
                constraint="uq_job_match_scores_user_job",
            )
        await db.execute(stmt)
        total_upserted = len(score_rows)

    logger.info(
        "Heuristic scored %d jobs for user %s, upserted %d scores (force=%s)",
        len(jobs_to_score),
        user_id,
        total_upserted,
        force,
    )
    return {
        "jobs_filtered": len(jobs),
        "jobs_scored": len(jobs_to_score),
        "scores_upserted": total_upserted,
    }
