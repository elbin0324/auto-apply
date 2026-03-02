"""add job enrichment columns

Revision ID: f6a9b4c3d2e1
Revises: e5f8a3b9c2d1
Create Date: 2026-03-02 18:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6a9b4c3d2e1"
down_revision: Union[str, None] = "e5f8a3b9c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("experience_level", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("employment_type", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("years_experience_min", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("years_experience_max", sa.Integer(), nullable=True))
    op.add_column("jobs", sa.Column("description_clean", sa.Text(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("enriched_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Index on enriched_at for finding un-enriched jobs efficiently
    op.create_index("ix_jobs_enriched_at", "jobs", ["enriched_at"])
    # Index on experience_level for filtering
    op.create_index("ix_jobs_experience_level", "jobs", ["experience_level"])
    # Index on employment_type for filtering
    op.create_index("ix_jobs_employment_type", "jobs", ["employment_type"])


def downgrade() -> None:
    op.drop_index("ix_jobs_employment_type")
    op.drop_index("ix_jobs_experience_level")
    op.drop_index("ix_jobs_enriched_at")
    op.drop_column("jobs", "enriched_at")
    op.drop_column("jobs", "description_clean")
    op.drop_column("jobs", "years_experience_max")
    op.drop_column("jobs", "years_experience_min")
    op.drop_column("jobs", "employment_type")
    op.drop_column("jobs", "experience_level")
