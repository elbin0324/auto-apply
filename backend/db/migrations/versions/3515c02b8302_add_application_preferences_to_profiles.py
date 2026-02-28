"""add_application_preferences_to_profiles

Revision ID: 3515c02b8302
Revises: b3a1c7e42d90
Create Date: 2026-02-27 19:27:04.294612

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3515c02b8302'
down_revision: Union[str, Sequence[str], None] = 'b3a1c7e42d90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add application_preferences JSONB column to profiles table."""
    op.add_column(
        'profiles',
        sa.Column(
            'application_preferences',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Remove application_preferences column from profiles table."""
    op.drop_column('profiles', 'application_preferences')
