"""Two-stage scoring service — vector similarity search + heuristic re-ranking.

Stage 1: pgvector HNSW search finds top-K candidates (~5ms)
Stage 2: Existing heuristic scorer (skills, title, location) re-ranks them
Combined: 70% heuristic + 30% vector similarity (scaled to 0-100)
"""

import logging
import uuid
from datetime import datetime, timezone

import numpy as np
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import get_settings
from models.auto_apply_config import AutoApplyConfig
from models.job import Job
from models.job_match_score import JobMatchScore
from models.profile import Profile
from models.user import User
from services.embedding_service import (
    build_job_embedding_text,
    build_user_embedding_text,
    embed_single,
    embed_texts,
)
from services.job_matcher import score_job_for_user

logger = logging.getLogger(__name__)


# ── Embedding storage ─────────────────────────────────────────────────────────


async def embed_and_store_jobs(
    db: AsyncSession,
    job_ids: list[uuid.UUID],
) -> dict:
    """Embed jobs that don't have embeddings yet and store vectors in DB.

    Returns stats: {total, already_embedded, newly_embedded}
    """
    stmt = select(Job).where(
        Job.id.in_(job_ids),
        Job.embedding.is_(None),
        Job.is_active.is_(True),
    )
    result = await db.execute(stmt)
    jobs = list(result.scalars().all())

    if not jobs:
        return {"total": len(job_ids), "already_embedded": len(job_ids), "newly_embedded": 0}

    texts = [
        build_job_embedding_text(
            title=j.title,
            description=j.description,
            company=j.company,
            tags=j.tags,
        )
        for j in jobs
    ]

    try:
        embeddings = await embed_texts(texts, input_type="document")
    except Exception:
        logger.exception("Failed to embed %d jobs", len(jobs))
        return {
            "total": len(job_ids),
            "already_embedded": len(job_ids) - len(jobs),
            "newly_embedded": 0,
            "error": "embedding_failed",
        }

    now = datetime.now(timezone.utc)
    for job, emb in zip(jobs, embeddings):
        job.embedding = emb
        job.embedding_updated_at = now

    await db.flush()
    logger.info("Embedded %d jobs", len(jobs))

    return {
        "total": len(job_ids),
        "already_embedded": len(job_ids) - len(jobs),
        "newly_embedded": len(jobs),
    }


async def embed_and_store_user(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> bool:
    """Embed a user's profile and store the vector.

    Returns True if embedding was updated.
    """
    stmt = (
        select(Profile)
        .options(selectinload(Profile.skills), selectinload(Profile.experiences))
        .where(Profile.user_id == user_id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        logger.warning("No profile for user %s", user_id)
        return False

    # Load auto-apply config for target titles and locations
    config_result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.user_id == user_id)
    )
    config = config_result.scalar_one_or_none()

    skill_names = [s.name for s in (profile.skills or [])]
    target_titles = list(config.target_titles or []) if config else []
    target_locations = list(config.target_locations or []) if config else []

    # Build experience summary
    exp_text = None
    if profile.experiences:
        exp_parts = []
        for e in sorted(profile.experiences, key=lambda x: x.sort_order):
            exp_parts.append(f"{e.title} at {e.company}")
            if e.description:
                exp_parts.append(e.description)
        exp_text = "; ".join(exp_parts)

    user_text = build_user_embedding_text(
        skills=skill_names,
        target_titles=target_titles,
        summary=profile.summary,
        experiences_text=exp_text,
        target_locations=target_locations,
    )

    if not user_text.strip():
        logger.warning("Empty embedding text for user %s", user_id)
        return False

    try:
        embedding = await embed_single(user_text, input_type="query")
    except Exception:
        logger.exception("Failed to embed user %s", user_id)
        return False

    profile.embedding = embedding
    profile.embedding_updated_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Embedded profile for user %s", user_id)
    return True


# ── Scoring ───────────────────────────────────────────────────────────────────


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a_arr = np.array(a, dtype=np.float32)
    b_arr = np.array(b, dtype=np.float32)
    dot = np.dot(a_arr, b_arr)
    norm = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if norm < 1e-10:
        return 0.0
    return float(dot / norm)


def _compute_combined_score(
    heuristic_score: float,
    cosine_sim: float,
) -> float:
    """Combine heuristic and vector scores: 70% heuristic + 30% vector."""
    vector_component = max(0.0, cosine_sim) * 100  # scale to 0-100
    return round(0.7 * heuristic_score + 0.3 * vector_component, 2)


async def _load_active_users_with_embeddings(
    db: AsyncSession,
) -> list[User]:
    """Load active users who have profile embeddings."""
    result = await db.execute(
        select(User)
        .join(AutoApplyConfig, User.id == AutoApplyConfig.user_id)
        .join(Profile, User.id == Profile.user_id)
        .where(
            AutoApplyConfig.is_active.is_(True),
            Profile.embedding.isnot(None),
        )
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
    """Score new/updated jobs against all active users.

    For each active user with an embedding, compute cosine similarity
    and heuristic scores for the new jobs, then store combined scores.
    """
    settings = get_settings()
    users = await _load_active_users_with_embeddings(db)

    if not users:
        return {"users_checked": 0, "scores_upserted": 0}

    # Load the specific jobs (only those with embeddings)
    jobs_result = await db.execute(
        select(Job).where(
            Job.id.in_(job_ids),
            Job.is_active.is_(True),
            Job.embedding.isnot(None),
        )
    )
    jobs = list(jobs_result.scalars().all())

    if not jobs:
        return {"users_checked": len(users), "scores_upserted": 0, "jobs_available": 0}

    total_upserted = 0
    now = datetime.now(timezone.utc)

    for user in users:
        profile = user.profile
        config = user.auto_apply_config
        if not profile or profile.embedding is None:
            continue

        skill_names = [s.name for s in (profile.skills or [])]
        target_titles = list(config.target_titles or []) if config else []
        target_locations = list(config.target_locations or []) if config else []

        score_rows = []
        for job in jobs:
            if job.embedding is None:
                continue

            cos_sim = _cosine_similarity(profile.embedding, job.embedding)

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

            combined = _compute_combined_score(heuristic_score, cos_sim)

            if combined >= settings.score_min_threshold:
                score_rows.append({
                    "user_id": user.id,
                    "job_id": job.id,
                    "score": combined,
                    "vector_score": round(cos_sim, 4),
                    "factors": {
                        **factors,
                        "vector_similarity": round(cos_sim, 4),
                        "combined_method": "hybrid",
                    },
                    "computed_at": now,
                })

        if score_rows:
            stmt = pg_insert(JobMatchScore).values(score_rows)
            stmt = stmt.on_conflict_do_update(
                constraint="uq_job_match_scores_user_job",
                set_={
                    "score": stmt.excluded.score,
                    "vector_score": stmt.excluded.vector_score,
                    "factors": stmt.excluded.factors,
                    "computed_at": stmt.excluded.computed_at,
                },
            )
            await db.execute(stmt)
            total_upserted += len(score_rows)

    logger.info(
        "Scored %d new jobs for %d users, upserted %d scores",
        len(jobs),
        len(users),
        total_upserted,
    )
    return {
        "users_checked": len(users),
        "jobs_scored": len(jobs),
        "scores_upserted": total_upserted,
    }


async def score_user_against_all_jobs(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> dict:
    """Score a user against all embedded jobs using vector search + heuristic re-rank.

    1. pgvector HNSW search: find top-K candidate jobs by cosine similarity
    2. Heuristic re-rank those candidates
    3. Upsert combined scores
    """
    settings = get_settings()

    # Load user profile with embedding
    stmt = (
        select(Profile)
        .options(selectinload(Profile.skills))
        .where(Profile.user_id == user_id)
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile or profile.embedding is None:
        logger.warning("No embedding for user %s", user_id)
        return {"error": "no_embedding"}

    # Load auto-apply config
    config_result = await db.execute(
        select(AutoApplyConfig).where(AutoApplyConfig.user_id == user_id)
    )
    config = config_result.scalar_one_or_none()

    # Stage 1: Vector search — top-K jobs by cosine similarity
    embedding_str = "[" + ",".join(str(x) for x in profile.embedding) + "]"

    vector_sql = text("""
        SELECT id, title, company, description, location, location_type,
               salary_min, salary_max, tags,
               (embedding <=> :user_embedding::vector) as distance
        FROM jobs
        WHERE is_active = true
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :user_embedding::vector
        LIMIT :limit
    """)

    vector_result = await db.execute(
        vector_sql,
        {"user_embedding": embedding_str, "limit": settings.vector_search_limit},
    )
    candidate_rows = vector_result.fetchall()

    if not candidate_rows:
        return {"candidates_found": 0, "scores_upserted": 0}

    # Stage 2: Heuristic re-rank
    skill_names = [s.name for s in (profile.skills or [])]
    target_titles = list(config.target_titles or []) if config else []
    target_locations = list(config.target_locations or []) if config else []

    score_rows = []
    now = datetime.now(timezone.utc)

    for row in candidate_rows:
        cos_distance = row.distance  # cosine distance = 1 - similarity
        cos_sim = 1.0 - cos_distance

        heuristic_score, factors = score_job_for_user(
            skill_names=skill_names,
            target_titles=target_titles,
            profile_location=profile.location,
            target_locations=target_locations,
            job_title=row.title or "",
            job_description=row.description,
            job_location=row.location,
            job_location_type=row.location_type,
        )

        combined = _compute_combined_score(heuristic_score, cos_sim)

        if combined >= settings.score_min_threshold:
            score_rows.append({
                "user_id": user_id,
                "job_id": row.id,
                "score": combined,
                "vector_score": round(cos_sim, 4),
                "factors": {
                    **factors,
                    "vector_similarity": round(cos_sim, 4),
                    "combined_method": "hybrid",
                },
                "computed_at": now,
            })

    if score_rows:
        stmt = pg_insert(JobMatchScore).values(score_rows)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_job_match_scores_user_job",
            set_={
                "score": stmt.excluded.score,
                "vector_score": stmt.excluded.vector_score,
                "factors": stmt.excluded.factors,
                "computed_at": stmt.excluded.computed_at,
            },
        )
        await db.execute(stmt)

    logger.info(
        "Scored user %s: %d candidates from vector search, %d scores upserted",
        user_id,
        len(candidate_rows),
        len(score_rows),
    )

    return {
        "candidates_found": len(candidate_rows),
        "scores_upserted": len(score_rows),
    }
