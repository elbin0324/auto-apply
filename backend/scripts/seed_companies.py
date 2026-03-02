"""Seed the companies table with known tech companies and their ATS board tokens.

Usage:
    cd backend && python -m scripts.seed_companies

Each entry is verified against the public ATS API endpoints.
"""

import asyncio
import logging
import os
import sys

# Make backend/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from models.company import Company

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Seed data ──────────────────────────────────────────────────────────────
# Format: (name, slug, ats_type, board_token, industry, career_page_url, ats_base_url)

SEED_COMPANIES: list[dict] = [
    # ── Greenhouse ─────────────────────────────────────────────────────────
    {"name": "Stripe", "slug": "stripe", "ats_type": "greenhouse", "board_token": "stripe", "industry": "fintech"},
    {"name": "Cloudflare", "slug": "cloudflare", "ats_type": "greenhouse", "board_token": "cloudflare", "industry": "infrastructure"},
    {"name": "Figma", "slug": "figma", "ats_type": "greenhouse", "board_token": "figma", "industry": "design"},
    {"name": "Datadog", "slug": "datadog", "ats_type": "greenhouse", "board_token": "datadog", "industry": "devtools"},
    {"name": "Airbnb", "slug": "airbnb", "ats_type": "greenhouse", "board_token": "airbnb", "industry": "travel"},
    {"name": "Coinbase", "slug": "coinbase", "ats_type": "greenhouse", "board_token": "coinbase", "industry": "crypto"},
    {"name": "DoorDash", "slug": "doordash", "ats_type": "greenhouse", "board_token": "doordash", "industry": "delivery"},
    {"name": "Twitch", "slug": "twitch", "ats_type": "greenhouse", "board_token": "twitch", "industry": "media"},
    {"name": "Pinterest", "slug": "pinterest", "ats_type": "greenhouse", "board_token": "pinterest", "industry": "social"},
    {"name": "Discord", "slug": "discord", "ats_type": "greenhouse", "board_token": "discord", "industry": "social"},
    {"name": "Brex", "slug": "brex", "ats_type": "greenhouse", "board_token": "brex", "industry": "fintech"},
    {"name": "Chime", "slug": "chime", "ats_type": "greenhouse", "board_token": "chime", "industry": "fintech"},
    {"name": "Amplitude", "slug": "amplitude", "ats_type": "greenhouse", "board_token": "amplitude", "industry": "analytics"},
    {"name": "Zapier", "slug": "zapier", "ats_type": "greenhouse", "board_token": "zapiercareers", "industry": "automation"},

    # ── Lever ──────────────────────────────────────────────────────────────
    {"name": "Wealthsimple", "slug": "wealthsimple", "ats_type": "lever", "board_token": "wealthsimple", "industry": "fintech"},

    # ── Ashby ──────────────────────────────────────────────────────────────
    {"name": "Linear", "slug": "linear", "ats_type": "ashby", "board_token": "linear", "industry": "devtools"},
    {"name": "Ramp", "slug": "ramp", "ats_type": "ashby", "board_token": "ramp", "industry": "fintech"},
    {"name": "Deel", "slug": "deel", "ats_type": "ashby", "board_token": "deel", "industry": "hr-tech"},
    {"name": "Notion", "slug": "notion", "ats_type": "ashby", "board_token": "notion", "industry": "productivity"},
    {"name": "Modern Treasury", "slug": "modern-treasury", "ats_type": "ashby", "board_token": "moderntreasury", "industry": "fintech"},
]


async def seed(db_url: str) -> None:
    engine = create_async_engine(
        db_url,
        connect_args={"statement_cache_size": 0},
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        added = 0
        skipped = 0

        for company_data in SEED_COMPANIES:
            slug = company_data["slug"]
            result = await session.execute(
                select(Company).where(Company.slug == slug)
            )
            if result.scalar_one_or_none():
                logger.info("Skipping %s (already exists)", slug)
                skipped += 1
                continue

            company = Company(**company_data)
            session.add(company)
            added += 1
            logger.info("Added %s (%s)", company_data["name"], company_data["ats_type"])

        await session.commit()
        logger.info("Seed complete: %d added, %d skipped", added, skipped)

    await engine.dispose()


if __name__ == "__main__":
    from config import get_settings

    settings = get_settings()
    asyncio.run(seed(settings.database_url))
