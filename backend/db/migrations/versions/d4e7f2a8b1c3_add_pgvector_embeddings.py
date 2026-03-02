"""add pgvector embeddings

Revision ID: d4e7f2a8b1c3
Revises: c7d2a1f89e34
Create Date: 2026-03-02 00:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "d4e7f2a8b1c3"
down_revision: Union[str, Sequence[str], None] = "c7d2a1f89e34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension (available on Supabase by default)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Add embedding columns to jobs table
    op.add_column("jobs", sa.Column("embedding", Vector(1024), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("embedding_updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Add embedding columns to profiles table
    op.add_column("profiles", sa.Column("embedding", Vector(1024), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("embedding_updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Add vector_score to job_match_scores
    op.add_column(
        "job_match_scores",
        sa.Column("vector_score", sa.Float(), nullable=True),
    )

    # Create HNSW indexes for fast approximate nearest-neighbor search
    op.execute(
        "CREATE INDEX ix_jobs_embedding_hnsw ON jobs "
        "USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )
    op.execute(
        "CREATE INDEX ix_profiles_embedding_hnsw ON profiles "
        "USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_profiles_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS ix_jobs_embedding_hnsw")

    op.drop_column("job_match_scores", "vector_score")
    op.drop_column("profiles", "embedding_updated_at")
    op.drop_column("profiles", "embedding")
    op.drop_column("jobs", "embedding_updated_at")
    op.drop_column("jobs", "embedding")

    op.execute("DROP EXTENSION IF EXISTS vector")
