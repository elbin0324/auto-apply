"""Schemas for ATS registry endpoints."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ATSPlatformResponse(BaseModel):
    """ATS platform with stats."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    display_name: str
    is_enabled: bool
    notes: str | None = None
    success_count: int = 0
    failure_count: int = 0
    last_success_at: datetime | None = None
    last_failure_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    active_job_count: int = 0


class ATSPlatformCreate(BaseModel):
    """Create a new ATS platform."""

    name: str
    display_name: str
    is_enabled: bool = False
    notes: str | None = None


class ATSPlatformUpdate(BaseModel):
    """Update an ATS platform."""

    display_name: str | None = None
    is_enabled: bool | None = None
    notes: str | None = None


class ATSDistribution(BaseModel):
    """ATS breakdown for admin overview."""

    name: str | None  # None = unknown ATS
    active_job_count: int
