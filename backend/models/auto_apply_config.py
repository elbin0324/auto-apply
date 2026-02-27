import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class AutoApplyConfig(Base, TimestampMixin):
    __tablename__ = "auto_apply_configs"

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
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    target_titles: Mapped[list | None] = mapped_column(JSONB)
    target_locations: Mapped[list | None] = mapped_column(JSONB)
    min_salary: Mapped[float | None] = mapped_column(Numeric)
    max_salary: Mapped[float | None] = mapped_column(Numeric)
    excluded_companies: Mapped[list | None] = mapped_column(JSONB)
    preferred_industries: Mapped[list | None] = mapped_column(JSONB)
    location_type_pref: Mapped[list | None] = mapped_column(JSONB)
    experience_level: Mapped[str | None] = mapped_column(String)  # entry, mid, senior, lead
    daily_apply_limit: Mapped[int] = mapped_column(Integer, default=25)
    require_review: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="auto_apply_config")  # type: ignore[name-defined]  # noqa: F821
