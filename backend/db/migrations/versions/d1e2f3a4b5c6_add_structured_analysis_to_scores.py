"""add_structured_analysis_to_scores

Revision ID: d1e2f3a4b5c6
Revises: c4d5e6f7a8b9
Create Date: 2026-03-10 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add structured_analysis JSONB column to job_match_scores."""
    op.add_column(
        "job_match_scores",
        sa.Column("structured_analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    """Remove structured_analysis column."""
    op.drop_column("job_match_scores", "structured_analysis")
