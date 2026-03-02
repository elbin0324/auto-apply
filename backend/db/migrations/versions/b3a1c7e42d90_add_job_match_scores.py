"""add_job_match_scores

Revision ID: b3a1c7e42d90
Revises: 91febbf95276
Create Date: 2026-02-27 18:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b3a1c7e42d90"
down_revision: Union[str, Sequence[str], None] = "91febbf95276"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_match_scores",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("factors", postgresql.JSONB(), nullable=True),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "job_id", name="uq_job_match_scores_user_job"),
    )
    op.create_index("ix_job_match_scores_user_id", "job_match_scores", ["user_id"])
    op.create_index("ix_job_match_scores_job_id", "job_match_scores", ["job_id"])
    op.create_index("ix_job_match_scores_score", "job_match_scores", ["score"])


def downgrade() -> None:
    op.drop_index("ix_job_match_scores_score", table_name="job_match_scores")
    op.drop_index("ix_job_match_scores_job_id", table_name="job_match_scores")
    op.drop_index("ix_job_match_scores_user_id", table_name="job_match_scores")
    op.drop_table("job_match_scores")
