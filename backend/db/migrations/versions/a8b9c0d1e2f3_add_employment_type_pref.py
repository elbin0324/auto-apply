"""add employment_type_pref to auto_apply_configs

Revision ID: a8b9c0d1e2f3
Revises: f6a9b4c3d2e1
Create Date: 2026-03-05 12:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "a8b9c0d1e2f3"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "auto_apply_configs",
        sa.Column("employment_type_pref", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("auto_apply_configs", "employment_type_pref")
