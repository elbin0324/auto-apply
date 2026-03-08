"""add ats_registry

Revision ID: c4d5e6f7a8b9
Revises: 9eeea3d40d65
Create Date: 2026-03-08 20:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "9eeea3d40d65"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Seed data — from application-runner's ATSRegistry
SEED_PLATFORMS = [
    ("greenhouse", "Greenhouse", True),
    ("ashby", "Ashby", True),
    ("lever", "Lever", True),
    ("workable", "Workable", True),
    ("freshteam", "Freshteam", False),
    ("teamtailor", "Teamtailor", False),
    ("recruitee", "Recruitee", False),
    ("breezy", "BreezyHR", False),
    ("pinpoint", "Pinpoint", False),
    ("comeet", "Comeet", False),
]


def upgrade() -> None:
    # 1. Add ats_platform column to jobs
    op.add_column("jobs", sa.Column("ats_platform", sa.String(), nullable=True))
    op.create_index("ix_jobs_ats_platform", "jobs", ["ats_platform"])

    # 2. Backfill ats_platform from tags array (source is tags[1] when present)
    # tags is JSONB array like ["ats", "greenhouse"] — index 1 is the ATS source
    op.execute(
        """
        UPDATE jobs
        SET ats_platform = tags->>1
        WHERE tags IS NOT NULL
          AND jsonb_array_length(tags) >= 2
          AND ats_platform IS NULL
        """
    )

    # 3. Create ats_platforms table
    op.create_table(
        "ats_platforms",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), default=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("success_count", sa.Integer(), default=0),
        sa.Column("failure_count", sa.Integer(), default=0),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_failure_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 4. Seed with known ATS platforms
    ats_table = sa.table(
        "ats_platforms",
        sa.column("name", sa.String),
        sa.column("display_name", sa.String),
        sa.column("is_enabled", sa.Boolean),
        sa.column("success_count", sa.Integer),
        sa.column("failure_count", sa.Integer),
    )
    op.bulk_insert(
        ats_table,
        [
            {
                "name": name,
                "display_name": display_name,
                "is_enabled": is_enabled,
                "success_count": 0,
                "failure_count": 0,
            }
            for name, display_name, is_enabled in SEED_PLATFORMS
        ],
    )


def downgrade() -> None:
    op.drop_table("ats_platforms")
    op.drop_index("ix_jobs_ats_platform", table_name="jobs")
    op.drop_column("jobs", "ats_platform")
