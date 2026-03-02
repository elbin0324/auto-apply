"""Backfill embeddings for existing jobs and profiles.

Usage:
    cd backend && python -m scripts.backfill_embeddings --jobs
    cd backend && python -m scripts.backfill_embeddings --profiles
    cd backend && python -m scripts.backfill_embeddings --jobs --profiles

Safe to re-run — skips rows that already have embeddings. Commits per batch.
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from models.job import Job
from models.profile import Profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BATCH_SIZE = 50


async def backfill_jobs(db_url: str) -> None:
    """Embed all active jobs that don't have embeddings yet."""
    from services.embedding_service import build_job_embedding_text, embed_texts

    engine = create_async_engine(
        db_url,
        connect_args={"statement_cache_size": 0},
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Count how many need embedding
        total = (await session.execute(
            select(func.count()).select_from(Job).where(
                Job.is_active.is_(True), Job.embedding.is_(None)
            )
        )).scalar_one()

        logger.info("Jobs to embed: %d", total)
        if total == 0:
            await engine.dispose()
            return

        offset = 0
        embedded = 0

        while True:
            result = await session.execute(
                select(Job)
                .where(Job.is_active.is_(True), Job.embedding.is_(None))
                .order_by(Job.id)
                .limit(BATCH_SIZE)
            )
            jobs = list(result.scalars().all())
            if not jobs:
                break

            texts = [
                build_job_embedding_text(
                    title=j.title,
                    description=j.description,
                    company=j.company_name,
                    tags=j.tags,
                )
                for j in jobs
            ]

            try:
                embeddings = await embed_texts(texts, input_type="document")
            except Exception:
                logger.exception("Failed to embed batch at offset %d", offset)
                break

            now = datetime.now(timezone.utc)
            for job, emb in zip(jobs, embeddings):
                job.embedding = emb
                job.embedding_updated_at = now

            await session.commit()
            embedded += len(jobs)
            offset += len(jobs)
            logger.info("Embedded %d/%d jobs", embedded, total)

        logger.info("Job backfill complete: %d embedded", embedded)

    await engine.dispose()


async def backfill_profiles(db_url: str) -> None:
    """Embed all profiles that don't have embeddings yet."""
    from sqlalchemy.orm import selectinload

    from services.embedding_service import build_user_embedding_text, embed_texts

    engine = create_async_engine(
        db_url,
        connect_args={"statement_cache_size": 0},
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        total = (await session.execute(
            select(func.count()).select_from(Profile).where(Profile.embedding.is_(None))
        )).scalar_one()

        logger.info("Profiles to embed: %d", total)
        if total == 0:
            await engine.dispose()
            return

        offset = 0
        embedded = 0

        while True:
            result = await session.execute(
                select(Profile)
                .options(
                    selectinload(Profile.skills),
                    selectinload(Profile.experiences),
                )
                .where(Profile.embedding.is_(None))
                .order_by(Profile.id)
                .limit(BATCH_SIZE)
            )
            profiles = list(result.scalars().all())
            if not profiles:
                break

            texts = []
            for p in profiles:
                skills = [s.name for s in p.skills] if p.skills else []
                prefs = p.application_preferences or {}
                target_titles = prefs.get("target_titles", [])
                target_locations = prefs.get("target_locations", [])
                exp_text = None
                if p.experiences:
                    exp_parts = [f"{e.title} at {e.company}" for e in p.experiences]
                    exp_text = "; ".join(exp_parts)

                text = build_user_embedding_text(
                    skills=skills,
                    target_titles=target_titles,
                    summary=p.summary,
                    experiences_text=exp_text,
                    target_locations=target_locations,
                )
                texts.append(text if text else "empty profile")

            try:
                embeddings = await embed_texts(texts, input_type="query")
            except Exception:
                logger.exception("Failed to embed batch at offset %d", offset)
                break

            now = datetime.now(timezone.utc)
            for profile, emb in zip(profiles, embeddings):
                profile.embedding = emb
                profile.embedding_updated_at = now

            await session.commit()
            embedded += len(profiles)
            offset += len(profiles)
            logger.info("Embedded %d/%d profiles", embedded, total)

        logger.info("Profile backfill complete: %d embedded", embedded)

    await engine.dispose()


async def main(args: argparse.Namespace) -> None:
    from config import get_settings

    settings = get_settings()
    db_url = settings.database_url

    if args.jobs:
        await backfill_jobs(db_url)
    if args.profiles:
        await backfill_profiles(db_url)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill embeddings for jobs and profiles")
    parser.add_argument("--jobs", action="store_true", help="Backfill job embeddings")
    parser.add_argument("--profiles", action="store_true", help="Backfill profile embeddings")
    args = parser.parse_args()

    if not args.jobs and not args.profiles:
        parser.error("Specify --jobs, --profiles, or both")

    asyncio.run(main(args))
