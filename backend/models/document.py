import uuid

from sqlalchemy import ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class GeneratedDocument(Base, TimestampMixin):
    __tablename__ = "generated_documents"

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
    doc_type: Mapped[str] = mapped_column(String, nullable=False)  # resume, cover_letter
    content: Mapped[str | None] = mapped_column(Text)
    file_url: Mapped[str | None] = mapped_column(String)
    match_score: Mapped[float | None] = mapped_column(Numeric)
    doc_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB)

    user: Mapped["User"] = relationship(lazy="noload")  # type: ignore[name-defined]  # noqa: F821
    job: Mapped["Job"] = relationship(lazy="noload")  # type: ignore[name-defined]  # noqa: F821
