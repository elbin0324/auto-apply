"""replace require_review with apply_mode

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-03-03 12:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns
    op.add_column(
        "auto_apply_configs",
        sa.Column("apply_mode", sa.String(), nullable=False, server_default="safe"),
    )
    op.add_column(
        "auto_apply_configs",
        sa.Column("auto_apply_threshold", sa.Integer(), nullable=False, server_default="70"),
    )

    # Migrate data: require_review=false -> auto, else safe
    op.execute("""
        UPDATE auto_apply_configs
        SET apply_mode = CASE
            WHEN require_review = false THEN 'auto'
            ELSE 'safe'
        END
    """)

    # Drop old column
    op.drop_column("auto_apply_configs", "require_review")


def downgrade() -> None:
    op.add_column(
        "auto_apply_configs",
        sa.Column("require_review", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.execute("""
        UPDATE auto_apply_configs
        SET require_review = CASE
            WHEN apply_mode = 'safe' THEN true
            ELSE false
        END
    """)
    op.drop_column("auto_apply_configs", "auto_apply_threshold")
    op.drop_column("auto_apply_configs", "apply_mode")
