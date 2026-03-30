import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.subscription import Subscription
from models.user import User

logger = logging.getLogger(__name__)

PLAN_QUOTAS: dict[str, int] = {
    "starter": 25,
    "pro": 100,
    "premium": 500,
}

PLAN_DETAILS: list[dict] = [
    {
        "name": "starter",
        "display_name": "Starter",
        "price_cents": 1900,
        "quota": 25,
        "features": [
            "25 applications / month",
            "AI resume tailoring",
            "All ATS platforms",
            "Application tracking",
        ],
    },
    {
        "name": "pro",
        "display_name": "Pro",
        "price_cents": 4900,
        "quota": 100,
        "features": [
            "100 applications / month",
            "AI resume + cover letters",
            "All ATS platforms",
            "Priority processing",
            "Analytics dashboard",
        ],
    },
    {
        "name": "premium",
        "display_name": "Premium",
        "price_cents": 9900,
        "quota": 500,
        "features": [
            "500 applications / month",
            "Everything in Pro",
            "Dedicated infrastructure",
            "Priority support",
            "Early access to features",
        ],
    },
]

PLAN_ORDER = ["starter", "pro", "premium"]


def price_id_to_plan(price_id: str) -> str | None:
    """Map a Stripe price ID to a plan name."""
    settings = get_settings()
    mapping = {
        settings.stripe_starter_price_id: "starter",
        settings.stripe_pro_price_id: "pro",
        settings.stripe_premium_price_id: "premium",
    }
    return mapping.get(price_id)


def plan_to_price_id(plan: str) -> str | None:
    """Map a plan name to a Stripe price ID."""
    settings = get_settings()
    mapping = {
        "starter": settings.stripe_starter_price_id,
        "pro": settings.stripe_pro_price_id,
        "premium": settings.stripe_premium_price_id,
    }
    return mapping.get(plan)


async def get_subscription_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> Subscription | None:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def check_subscription_access(
    db: AsyncSession, user: User
) -> dict:
    """Check if a user can apply. Returns dict with allowed, reason, and quota info."""
    if user.is_whitelisted:
        return {"allowed": True, "reason": "whitelisted"}

    sub = await get_subscription_for_user(db, user.id)

    if not sub or sub.status not in ("active", "past_due"):
        return {"allowed": False, "reason": "no_subscription"}

    quota = PLAN_QUOTAS.get(sub.plan, 0)
    if sub.applications_used >= quota:
        next_plan = _get_next_plan(sub.plan)
        return {
            "allowed": False,
            "reason": "quota_exceeded",
            "plan": sub.plan,
            "quota": quota,
            "applications_used": sub.applications_used,
            "next_plan": next_plan,
        }

    return {
        "allowed": True,
        "reason": "active",
        "plan": sub.plan,
        "quota": quota,
        "applications_used": sub.applications_used,
        "remaining": quota - sub.applications_used,
    }


async def increment_applications_used(
    db: AsyncSession, user_id: uuid.UUID
) -> None:
    """Increment the applications_used counter for a user's subscription."""
    sub = await get_subscription_for_user(db, user_id)
    if sub:
        sub.applications_used += 1
        await db.flush()


async def get_subscription_status(
    db: AsyncSession, user: User
) -> dict:
    """Get subscription status for the API response."""
    sub = await get_subscription_for_user(db, user.id)
    if not sub or sub.status not in ("active", "past_due"):
        return {
            "plan": None,
            "status": sub.status if sub else None,
            "applications_used": 0,
            "quota": 0,
            "remaining": 0,
            "current_period_end": None,
            "is_whitelisted": user.is_whitelisted,
        }

    quota = PLAN_QUOTAS.get(sub.plan, 0)
    return {
        "plan": sub.plan,
        "status": sub.status,
        "applications_used": sub.applications_used,
        "quota": quota,
        "remaining": max(0, quota - sub.applications_used),
        "current_period_end": sub.current_period_end,
        "is_whitelisted": user.is_whitelisted,
    }


def _get_next_plan(current_plan: str) -> str | None:
    """Return the next tier up, or None if already at the highest."""
    try:
        idx = PLAN_ORDER.index(current_plan)
    except ValueError:
        return "starter"
    if idx + 1 < len(PLAN_ORDER):
        return PLAN_ORDER[idx + 1]
    return None
