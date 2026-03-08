"""add_phase09_application_columns

Revision ID: 9eeea3d40d65
Revises: a8b9c0d1e2f3
Create Date: 2026-03-08 18:23:58.315922

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9eeea3d40d65'
down_revision: Union[str, Sequence[str], None] = 'a8b9c0d1e2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Phase 09 observability columns to applications."""
    op.add_column('applications', sa.Column('current_phase', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('phase_message', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('generated_application', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('applications', sa.Column('task_mode', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove Phase 09 columns."""
    op.drop_column('applications', 'task_mode')
    op.drop_column('applications', 'generated_application')
    op.drop_column('applications', 'phase_message')
    op.drop_column('applications', 'current_phase')
