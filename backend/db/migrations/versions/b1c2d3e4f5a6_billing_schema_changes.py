"""billing_schema_changes

Revision ID: b1c2d3e4f5a6
Revises: 3515c02b8302
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "3515c02b8302"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add applications_used to subscriptions
    op.add_column(
        "subscriptions",
        sa.Column("applications_used", sa.Integer(), nullable=False, server_default="0"),
    )

    # Drop credit columns from subscriptions
    op.drop_column("subscriptions", "credits_remaining")
    op.drop_column("subscriptions", "credits_used_total")

    # Add is_whitelisted to users
    op.add_column(
        "users",
        sa.Column(
            "is_whitelisted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Drop credit_transactions table
    op.drop_table("credit_transactions")


def downgrade() -> None:
    # Recreate credit_transactions table
    op.create_table(
        "credit_transactions",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("reference_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_credit_transactions_user_id",
        "credit_transactions",
        ["user_id"],
    )

    # Drop is_whitelisted from users
    op.drop_column("users", "is_whitelisted")

    # Restore credit columns on subscriptions
    op.add_column(
        "subscriptions",
        sa.Column("credits_used_total", sa.Integer(), server_default="0", nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("credits_remaining", sa.Integer(), server_default="0", nullable=True),
    )

    # Drop applications_used from subscriptions
    op.drop_column("subscriptions", "applications_used")
