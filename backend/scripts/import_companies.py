"""Bulk import companies from a JSON file.

Usage:
    cd backend && python -m scripts.import_companies companies.json

JSON format: list of objects with required fields: name, slug, ats_type, board_token
Optional fields: industry, career_page_url, ats_base_url

Example:
    [
        {"name": "Acme Corp", "slug": "acme", "ats_type": "greenhouse", "board_token": "acme"},
        {"name": "Widgets Inc", "slug": "widgets", "ats_type": "lever", "board_token": "widgets-inc"}
    ]
"""

import asyncio
import json
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from models.company import Company

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REQUIRED_FIELDS = {"name", "slug", "ats_type", "board_token"}
ALLOWED_FIELDS = REQUIRED_FIELDS | {"industry", "career_page_url", "ats_base_url"}


async def import_companies(db_url: str, json_path: str) -> None:
    with open(json_path) as f:
        data = json.load(f)

    if not isinstance(data, list):
        logger.error("JSON must be a list of company objects")
        sys.exit(1)

    engine = create_async_engine(
        db_url,
        connect_args={"statement_cache_size": 0},
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        added = 0
        skipped = 0
        errors = 0

        for i, entry in enumerate(data):
            missing = REQUIRED_FIELDS - set(entry.keys())
            if missing:
                logger.warning("Row %d: missing required fields %s, skipping", i, missing)
                errors += 1
                continue

            slug = entry["slug"]
            result = await session.execute(
                select(Company).where(Company.slug == slug)
            )
            if result.scalar_one_or_none():
                logger.info("Skipping %s (already exists)", slug)
                skipped += 1
                continue

            # Only pass allowed fields to the model
            company_data = {k: v for k, v in entry.items() if k in ALLOWED_FIELDS}
            company = Company(**company_data)
            session.add(company)
            added += 1
            logger.info("Added %s (%s/%s)", entry["name"], entry["ats_type"], slug)

        await session.commit()
        logger.info(
            "Import complete: %d added, %d skipped (existing), %d errors",
            added, skipped, errors,
        )

    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.import_companies <companies.json>")
        sys.exit(1)

    from config import get_settings

    settings = get_settings()
    asyncio.run(import_companies(settings.database_url, sys.argv[1]))
