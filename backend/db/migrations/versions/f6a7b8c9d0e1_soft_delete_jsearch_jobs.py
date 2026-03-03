"""Soft-delete JSearch jobs for Fantastic Jobs API migration.

Revision ID: f6a7b8c9d0e1
Revises: e5f8a3b9c2d1
Create Date: 2026-03-03 12:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f8a3b9c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE jobs SET is_active = false WHERE external_id LIKE 'jsearch:%'")


def downgrade() -> None:
    op.execute("UPDATE jobs SET is_active = true WHERE external_id LIKE 'jsearch:%'")
