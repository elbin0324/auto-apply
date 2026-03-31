import logging

import stripe
from fastapi import APIRouter, HTTPException, Request, status

from config import get_settings
from deps import CurrentUser, DbSession
from schemas.billing import (
    CheckoutRequest,
    CheckoutSession,
    PlanDetail,
    PlansResponse,
    PortalSession,
    SubscriptionStatus,
)
from services.billing_service import (
    PLAN_DETAILS,
    PLAN_QUOTAS,
    get_subscription_for_user,
    get_subscription_status,
    plan_to_price_id,
    price_id_to_plan,
)
from models.subscription import Subscription

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


# ── Public: available plans ──────────────────────────────────────────────────


@router.get("/plans", response_model=PlansResponse)
async def get_plans() -> PlansResponse:
    return PlansResponse(
        plans=[PlanDetail(**p) for p in PLAN_DETAILS]
    )


# ── Authenticated: subscription status ───────────────────────────────────────


@router.get("/subscription", response_model=SubscriptionStatus)
async def get_subscription(user: CurrentUser, db: DbSession) -> SubscriptionStatus:
    data = await get_subscription_status(db, user)
    return SubscriptionStatus(**data)


# ── Authenticated: create checkout session ───────────────────────────────────


@router.post("/checkout", response_model=CheckoutSession)
async def create_checkout(
    body: CheckoutRequest, user: CurrentUser, db: DbSession
) -> CheckoutSession:
    settings = get_settings()

    if body.plan not in PLAN_QUOTAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan: {body.plan}",
        )

    price_id = plan_to_price_id(body.plan)
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe price not configured for this plan",
        )

    stripe.api_key = settings.stripe_secret_key

    # Get or create Stripe customer
    sub = await get_subscription_for_user(db, user.id)
    customer_id = sub.stripe_customer_id if sub else None

    if not customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )
        customer_id = customer.id

        # Store customer ID
        if not sub:
            sub = Subscription(
                user_id=user.id,
                stripe_customer_id=customer_id,
                plan=body.plan,
                status="incomplete",
            )
            db.add(sub)
        else:
            sub.stripe_customer_id = customer_id
        await db.flush()

    checkout_session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.allowed_origins.split(',')[0]}/settings?billing=success",
        cancel_url=f"{settings.allowed_origins.split(',')[0]}/billing?canceled=true",
        metadata={"user_id": str(user.id), "plan": body.plan},
    )

    return CheckoutSession(
        checkout_url=checkout_session.url,
        session_id=checkout_session.id,
    )


# ── Authenticated: customer portal ──────────────────────────────────────────


@router.post("/portal", response_model=PortalSession)
async def create_portal_session(user: CurrentUser, db: DbSession) -> PortalSession:
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    sub = await get_subscription_for_user(db, user.id)
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing account found",
        )

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.allowed_origins.split(',')[0]}/settings",
    )

    return PortalSession(portal_url=session.url)


# ── Stripe webhooks ──────────────────────────────────────────────────────────


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: DbSession) -> dict:
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(db, data)
    elif event_type == "invoice.paid":
        await _handle_invoice_paid(db, data)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(db, data)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(db, data)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(db, data)

    return {"status": "ok"}


async def _handle_checkout_completed(db, session_data: dict) -> None:
    """Handle successful checkout — activate subscription."""
    from datetime import datetime, timezone
    from sqlalchemy import select

    customer_id = session_data["customer"]
    subscription_id = session_data.get("subscription")

    if not subscription_id:
        return

    stripe_sub = stripe.Subscription.retrieve(subscription_id)
    price_id = stripe_sub["items"]["data"][0]["price"]["id"]
    plan = price_id_to_plan(price_id)

    if not plan:
        logger.error("Unknown price ID from checkout: %s", price_id)
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()

    if sub:
        sub.stripe_subscription_id = subscription_id
        sub.plan = plan
        sub.status = "active"
        sub.applications_used = 0
        sub.current_period_start = datetime.fromtimestamp(
            stripe_sub["current_period_start"], tz=timezone.utc
        )
        sub.current_period_end = datetime.fromtimestamp(
            stripe_sub["current_period_end"], tz=timezone.utc
        )
    else:
        user_id = session_data.get("metadata", {}).get("user_id")
        if not user_id:
            logger.error("No user_id in checkout metadata")
            return
        sub = Subscription(
            user_id=user_id,
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
            plan=plan,
            status="active",
            applications_used=0,
            current_period_start=datetime.fromtimestamp(
                stripe_sub["current_period_start"], tz=timezone.utc
            ),
            current_period_end=datetime.fromtimestamp(
                stripe_sub["current_period_end"], tz=timezone.utc
            ),
        )
        db.add(sub)

    await db.flush()
    logger.info("Checkout completed: customer=%s plan=%s", customer_id, plan)


async def _handle_invoice_paid(db, invoice_data: dict) -> None:
    """Handle recurring invoice payment — reset quota."""
    from datetime import datetime, timezone
    from sqlalchemy import select

    subscription_id = invoice_data.get("subscription")
    if not subscription_id:
        return

    billing_reason = invoice_data.get("billing_reason")
    if billing_reason == "subscription_create":
        return

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    sub.applications_used = 0

    stripe_sub = stripe.Subscription.retrieve(subscription_id)
    sub.current_period_start = datetime.fromtimestamp(
        stripe_sub["current_period_start"], tz=timezone.utc
    )
    sub.current_period_end = datetime.fromtimestamp(
        stripe_sub["current_period_end"], tz=timezone.utc
    )
    sub.status = "active"
    await db.flush()
    logger.info("Invoice paid — quota reset for subscription %s", subscription_id)


async def _handle_subscription_updated(db, sub_data: dict) -> None:
    """Handle subscription changes (e.g. mid-cycle upgrade)."""
    from sqlalchemy import select

    subscription_id = sub_data["id"]
    price_id = sub_data["items"]["data"][0]["price"]["id"]
    plan = price_id_to_plan(price_id)

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    if plan and plan != sub.plan:
        sub.plan = plan
        logger.info("Subscription %s upgraded to %s", subscription_id, plan)

    sub.status = sub_data.get("status", sub.status)
    await db.flush()


async def _handle_subscription_deleted(db, sub_data: dict) -> None:
    """Handle subscription cancellation."""
    from sqlalchemy import select

    subscription_id = sub_data["id"]

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    sub.status = "canceled"
    await db.flush()
    logger.info("Subscription %s canceled", subscription_id)


async def _handle_payment_failed(db, invoice_data: dict) -> None:
    """Handle failed payment — mark as past_due."""
    from sqlalchemy import select

    subscription_id = invoice_data.get("subscription")
    if not subscription_id:
        return

    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    sub.status = "past_due"
    await db.flush()
    logger.info("Payment failed for subscription %s", subscription_id)
