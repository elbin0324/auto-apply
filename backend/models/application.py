import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
    )
    # queued, pending_review, in_progress, applied, failed, skipped, withdrawn
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued", index=True)
    applied_at: Mapped[datetime | None] = mapped_column()
    resume_used_url: Mapped[str | None] = mapped_column(String)
    cover_letter_used: Mapped[str | None] = mapped_column(Text)
    screenshot_url: Mapped[str | None] = mapped_column(String)
    error_message: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    current_phase: Mapped[str | None] = mapped_column(String, default=None)
    phase_message: Mapped[str | None] = mapped_column(String, default=None)
    generated_application: Mapped[dict | None] = mapped_column("generated_application", JSONB, default=None)
    task_mode: Mapped[str | None] = mapped_column(String, default=None)

    user: Mapped["User"] = relationship(back_populates="applications")  # type: ignore[name-defined]  # noqa: F821
    job: Mapped["Job"] = relationship(lazy="noload")  # type: ignore[name-defined]  # noqa: F821
