from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlanInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: str  # free, pro, premium
    status: str
    credits_remaining: int
    credits_used_total: int
    current_period_end: datetime | None = None
    stripe_customer_id: str | None = None


class CreditPurchase(BaseModel):
    credit_pack: str  # credits_10, credits_50, credits_100, credits_250


class CheckoutSession(BaseModel):
    checkout_url: str
    session_id: str


class TransactionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: int
    reason: str | None = None
    reference_id: UUID | None = None
    created_at: datetime


class TransactionHistory(BaseModel):
    transactions: list[TransactionItem]
    total: int
    page: int
    per_page: int
