from datetime import datetime

from pydantic import BaseModel


class PlanDetail(BaseModel):
    name: str  # starter, pro, premium
    display_name: str
    price_cents: int  # 1900, 4900, 9900
    quota: int  # 25, 100, 500
    features: list[str]


class PlansResponse(BaseModel):
    plans: list[PlanDetail]


class SubscriptionStatus(BaseModel):
    plan: str | None = None  # None = no subscription
    status: str | None = None
    applications_used: int = 0
    quota: int = 0
    remaining: int = 0
    current_period_end: datetime | None = None
    is_whitelisted: bool = False


class CheckoutRequest(BaseModel):
    plan: str  # starter, pro, premium


class CheckoutSession(BaseModel):
    checkout_url: str
    session_id: str


class PortalSession(BaseModel):
    portal_url: str
