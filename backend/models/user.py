import uuid

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """Mirrors Supabase auth.users — no password storage."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    supabase_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, server_default="user")

    # Relationships
    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False, lazy="noload")  # type: ignore[name-defined]  # noqa: F821
    applications: Mapped[list["Application"]] = relationship(back_populates="user", lazy="noload")  # type: ignore[name-defined]  # noqa: F821
    subscription: Mapped["Subscription"] = relationship(back_populates="user", uselist=False, lazy="noload")  # type: ignore[name-defined]  # noqa: F821
    auto_apply_config: Mapped["AutoApplyConfig"] = relationship(back_populates="user", uselist=False, lazy="noload")  # type: ignore[name-defined]  # noqa: F821
