import uuid
from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

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
    full_name: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String)
    linkedin_url: Mapped[str | None] = mapped_column(String)
    website_url: Mapped[str | None] = mapped_column(String)
    summary: Mapped[str | None] = mapped_column(Text)
    raw_resume_url: Mapped[str | None] = mapped_column(String)
    parsed_resume: Mapped[dict | None] = mapped_column(JSONB)
    application_preferences: Mapped[dict | None] = mapped_column(JSONB)
    resume_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Vector embedding for semantic search (Voyage AI, 1024 dims)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1024), nullable=True)
    embedding_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profile")  # type: ignore[name-defined]  # noqa: F821
    experiences: Mapped[list["Experience"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan", lazy="noload"
    )
    educations: Mapped[list["Education"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan", lazy="noload"
    )
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan", lazy="noload"
    )


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    bullets: Mapped[list | None] = mapped_column(JSONB)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    profile: Mapped["Profile"] = relationship(back_populates="experiences")


class Education(Base):
    __tablename__ = "educations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution: Mapped[str] = mapped_column(Text, nullable=False)
    degree: Mapped[str | None] = mapped_column(String)
    field_of_study: Mapped[str | None] = mapped_column(String)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    gpa: Mapped[str | None] = mapped_column(String)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    profile: Mapped["Profile"] = relationship(back_populates="educations")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
    proficiency: Mapped[str | None] = mapped_column(String)

    profile: Mapped["Profile"] = relationship(back_populates="skills")
