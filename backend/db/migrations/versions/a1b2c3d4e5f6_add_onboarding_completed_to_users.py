"""add onboarding_completed to users

Revision ID: a1b2c3d4e5f6
Revises: f6a9b4c3d2e1
Create Date: 2026-03-02 20:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f6a9b4c3d2e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Mark existing users with a populated profile as already onboarded
    op.execute("""
        UPDATE users SET onboarding_completed = true
        WHERE id IN (
            SELECT u.id FROM users u
            JOIN profiles p ON p.user_id = u.id
            WHERE p.full_name IS NOT NULL AND p.full_name != ''
        )
    """)


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed")
