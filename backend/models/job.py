import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base, TimestampMixin


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    external_id: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    company: Mapped[str | None] = mapped_column(Text)
    company_logo_url: Mapped[str | None] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String, index=True)
    location_type: Mapped[str | None] = mapped_column(String)  # remote, hybrid, onsite
    salary_min: Mapped[float | None] = mapped_column(Numeric)
    salary_max: Mapped[float | None] = mapped_column(Numeric)
    salary_currency: Mapped[str] = mapped_column(String, default="CAD")
    description: Mapped[str | None] = mapped_column(Text)
    requirements: Mapped[dict | None] = mapped_column(JSONB)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    apply_url: Mapped[str | None] = mapped_column(Text)  # Direct application form URL
    source: Mapped[str] = mapped_column(String, default="adzuna")
    category: Mapped[str | None] = mapped_column(String)
    tags: Mapped[list | None] = mapped_column(JSONB)
    ats_platform: Mapped[str | None] = mapped_column(String, index=True)

    # API-sourced metadata
    source_domain: Mapped[str | None] = mapped_column(String)
    organization_url: Mapped[str | None] = mapped_column(String)
    domain_derived: Mapped[str | None] = mapped_column(String)
    country: Mapped[str | None] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String)
    ai_enrichment: Mapped[dict | None] = mapped_column(JSONB)

    # Enrichment fields (populated by LLM enrichment worker)
    experience_level: Mapped[str | None] = mapped_column(String)  # entry, mid, senior, lead, executive
    employment_type: Mapped[str | None] = mapped_column(String)  # full_time, part_time, contract, internship
    years_experience_min: Mapped[int | None] = mapped_column(Integer)
    years_experience_max: Mapped[int | None] = mapped_column(Integer)
    description_clean: Mapped[str | None] = mapped_column(Text)
    enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    __table_args__ = (
        Index(
            "idx_jobs_search",
            text(
                "to_tsvector('english', "
                "coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description, ''))"
            ),
            postgresql_using="gin",
        ),
    )
