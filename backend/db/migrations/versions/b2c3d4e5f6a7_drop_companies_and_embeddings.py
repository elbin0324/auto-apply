"""drop companies table and embedding columns

Removes the companies table, job.company_id FK, embedding columns from
jobs/profiles, vector_score from job_match_scores, and the pgvector extension.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-02 18:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Drop embedding infrastructure ────────────────────────────────────
    op.execute("DROP INDEX IF EXISTS ix_profiles_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS ix_jobs_embedding_hnsw")

    op.drop_column("job_match_scores", "vector_score")
    op.drop_column("profiles", "embedding_updated_at")
    op.drop_column("profiles", "embedding")
    op.drop_column("jobs", "embedding_updated_at")
    op.drop_column("jobs", "embedding")

    op.execute("DROP EXTENSION IF EXISTS vector")

    # ── Drop company_id FK from jobs ─────────────────────────────────────
    op.drop_index("ix_jobs_company_id", table_name="jobs")
    op.drop_constraint("fk_jobs_company_id", "jobs", type_="foreignkey")
    op.drop_column("jobs", "company_id")

    # ── Drop companies table ─────────────────────────────────────────────
    op.drop_index("ix_companies_is_active", table_name="companies")
    op.drop_index("ix_companies_ats_type", table_name="companies")
    op.drop_index("ix_companies_slug", table_name="companies")
    op.drop_table("companies")


def downgrade() -> None:
    # ── Recreate companies table ─────────────────────────────────────────
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

    # ── Restore company_id FK on jobs ────────────────────────────────────
    op.add_column(
        "jobs",
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True),
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

    # ── Restore embedding columns ────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.add_column("jobs", sa.Column("embedding", sa.LargeBinary(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("embedding_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("profiles", sa.Column("embedding", sa.LargeBinary(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("embedding_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "job_match_scores",
        sa.Column("vector_score", sa.Float(), nullable=True),
    )
