"""Create compliance_records table

Revision ID: 001_compliance
Revises:
Create Date: 2026-04-06

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_compliance"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "compliance_records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("warning_type", sa.String(50), nullable=False),
        sa.Column("confirmed_at", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_compliance_records_user_id", "compliance_records", ["user_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_compliance_records_user_id", "compliance_records")
    op.drop_table("compliance_records")
