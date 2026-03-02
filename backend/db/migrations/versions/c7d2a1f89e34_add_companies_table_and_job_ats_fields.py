"""add_companies_table_and_job_ats_fields

Revision ID: c7d2a1f89e34
Revises: 3515c02b8302
Create Date: 2026-03-02 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c7d2a1f89e34"
down_revision: Union[str, Sequence[str], None] = "3515c02b8302"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create companies table
    op.create_table(
        "companies",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("ats_type", sa.String(), nullable=False),
        sa.Column("board_token", sa.String(), nullable=False),
        sa.Column("career_page_url", sa.Text(), nullable=True),
        sa.Column("ats_base_url", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("industry", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("last_crawled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("job_count", sa.Integer(), default=0, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_companies_slug", "companies", ["slug"], unique=True)
    op.create_index("ix_companies_ats_type", "companies", ["ats_type"])
    op.create_index("ix_companies_is_active", "companies", ["is_active"])

    # Add new columns to jobs table
    op.add_column(
        "jobs",
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.add_column(
        "jobs",
        sa.Column("apply_url", sa.Text(), nullable=True),
    )
    op.create_foreign_key(
        "fk_jobs_company_id",
        "jobs",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])


def downgrade() -> None:
    op.drop_index("ix_jobs_company_id", table_name="jobs")
    op.drop_constraint("fk_jobs_company_id", "jobs", type_="foreignkey")
    op.drop_column("jobs", "apply_url")
    op.drop_column("jobs", "company_id")
    op.drop_index("ix_companies_is_active", table_name="companies")
    op.drop_index("ix_companies_ats_type", table_name="companies")
    op.drop_index("ix_companies_slug", table_name="companies")
    op.drop_table("companies")
