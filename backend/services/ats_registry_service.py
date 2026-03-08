"""ATS registry service — manage supported ATS platforms and track results."""

import logging
import time
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.ats_registry import ATSPlatform
from models.job import Job

logger = logging.getLogger(__name__)

# ── Cache for dispatch hot path ──────────────────────────────────────────────

_enabled_ats_cache: set[str] | None = None
_cache_expires_at: float = 0.0
_CACHE_TTL = 60.0  # seconds


async def get_enabled_ats_names(db: AsyncSession) -> set[str]:
    """Return set of enabled ATS platform names, cached for 60s."""
    global _enabled_ats_cache, _cache_expires_at

    now = time.monotonic()
    if _enabled_ats_cache is not None and now < _cache_expires_at:
        return _enabled_ats_cache

    result = await db.execute(
        select(ATSPlatform.name).where(ATSPlatform.is_enabled.is_(True))
    )
    names = set(result.scalars().all())
    _enabled_ats_cache = names
    _cache_expires_at = now + _CACHE_TTL
    return names


def invalidate_cache() -> None:
    """Force cache refresh on next call."""
    global _enabled_ats_cache, _cache_expires_at
    _enabled_ats_cache = None
    _cache_expires_at = 0.0


# ── CRUD ─────────────────────────────────────────────────────────────────────


async def get_all_platforms(db: AsyncSession) -> list[ATSPlatform]:
    """Return all ATS platforms ordered by name."""
    result = await db.execute(
        select(ATSPlatform).order_by(ATSPlatform.name)
    )
    return list(result.scalars().all())


async def get_platform_by_name(db: AsyncSession, name: str) -> ATSPlatform | None:
    result = await db.execute(
        select(ATSPlatform).where(ATSPlatform.name == name)
    )
    return result.scalar_one_or_none()


async def create_platform(
    db: AsyncSession,
    *,
    name: str,
    display_name: str,
    is_enabled: bool = False,
    notes: str | None = None,
) -> ATSPlatform:
    platform = ATSPlatform(
        name=name,
        display_name=display_name,
        is_enabled=is_enabled,
        notes=notes,
    )
    db.add(platform)
    await db.flush()
    invalidate_cache()
    return platform


async def update_platform(
    db: AsyncSession,
    name: str,
    **kwargs: object,
) -> ATSPlatform | None:
    """Update a platform by name. Returns updated platform or None if not found."""
    platform = await get_platform_by_name(db, name)
    if not platform:
        return None

    for key, value in kwargs.items():
        if value is not None and hasattr(platform, key):
            setattr(platform, key, value)

    await db.flush()
    invalidate_cache()
    return platform


# ── Result tracking ──────────────────────────────────────────────────────────


async def record_result(db: AsyncSession, ats_name: str, success: bool) -> None:
    """Increment success/failure counter for an ATS platform."""
    now = datetime.now(timezone.utc)

    if success:
        stmt = (
            update(ATSPlatform)
            .where(ATSPlatform.name == ats_name)
            .values(
                success_count=ATSPlatform.success_count + 1,
                last_success_at=now,
            )
        )
    else:
        stmt = (
            update(ATSPlatform)
            .where(ATSPlatform.name == ats_name)
            .values(
                failure_count=ATSPlatform.failure_count + 1,
                last_failure_at=now,
            )
        )

    result = await db.execute(stmt)
    if result.rowcount == 0:
        logger.debug("ATS platform %r not in registry, skipping result tracking", ats_name)


# ── Stats ────────────────────────────────────────────────────────────────────


async def get_ats_job_counts(db: AsyncSession) -> dict[str | None, int]:
    """Count active jobs grouped by ats_platform."""
    result = await db.execute(
        select(Job.ats_platform, func.count(Job.id))
        .where(Job.is_active.is_(True))
        .group_by(Job.ats_platform)
    )
    return {row[0]: row[1] for row in result.all()}
