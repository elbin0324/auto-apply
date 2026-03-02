import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base, TimestampMixin


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    ats_type: Mapped[str] = mapped_column(
        String, nullable=False, index=True
    )  # greenhouse, lever, ashby, smartrecruiters, workday
    board_token: Mapped[str] = mapped_column(
        String, nullable=False
    )  # ATS-specific identifier
    career_page_url: Mapped[str | None] = mapped_column(Text)
    ats_base_url: Mapped[str | None] = mapped_column(
        Text
    )  # For Workday: company.wd5.myworkdayjobs.com
    logo_url: Mapped[str | None] = mapped_column(Text)
    industry: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    last_crawled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    job_count: Mapped[int] = mapped_column(Integer, default=0)
