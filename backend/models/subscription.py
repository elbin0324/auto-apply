import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(String, unique=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String, unique=True)
    plan: Mapped[str] = mapped_column(String, nullable=False)  # starter, pro, premium
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    applications_used: Mapped[int] = mapped_column(Integer, default=0)
    current_period_start: Mapped[datetime | None] = mapped_column()
    current_period_end: Mapped[datetime | None] = mapped_column()

    user: Mapped["User"] = relationship(back_populates="subscription")  # type: ignore[name-defined]  # noqa: F821
