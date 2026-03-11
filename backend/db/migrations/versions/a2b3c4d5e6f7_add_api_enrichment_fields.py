"""add api enrichment fields to jobs

Revision ID: a2b3c4d5e6f7
Revises: d1e2f3a4b5c6
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = "a2b3c4d5e6f7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("source_domain", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("organization_url", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("domain_derived", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("country", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("city", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("ai_enrichment", JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "ai_enrichment")
    op.drop_column("jobs", "city")
    op.drop_column("jobs", "country")
    op.drop_column("jobs", "domain_derived")
    op.drop_column("jobs", "organization_url")
    op.drop_column("jobs", "source_domain")
