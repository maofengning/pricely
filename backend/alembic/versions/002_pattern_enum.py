"""update_pattern_enum

Revision ID: 002_pattern_enum
Revises: 001_compliance
Create Date: 2026-04-06

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_pattern_enum"
down_revision: str | Sequence[str] | None = "001_compliance"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - update PatternEnum values."""
    # PostgreSQL requires special handling for enum modifications
    # Step 1: Create new enum type with updated values
    op.execute("""
        CREATE TYPE new_patternenum AS ENUM (
            'HEAD_AND_SHOULDERS_TOP',
            'HEAD_AND_SHOULDERS_BOTTOM',
            'DOUBLE_TOP',
            'DOUBLE_BOTTOM',
            'TRIPLE_TOP',
            'TRIPLE_BOTTOM',
            'TRIANGLE',
            'FLAG'
        );
    """)

    # Step 2: Alter pattern_marks table to use new enum
    op.execute("""
        ALTER TABLE pattern_marks
        ALTER COLUMN pattern_type TYPE new_patternenum
        USING pattern_type::text::new_patternenum;
    """)

    # Step 3: Alter trade_logs table to use new enum
    op.execute("""
        ALTER TABLE trade_logs
        ALTER COLUMN pattern_type TYPE new_patternenum
        USING pattern_type::text::new_patternenum;
    """)

    # Step 4: Drop old enum type
    op.execute("DROP TYPE patternenum;")

    # Step 5: Rename new enum to original name
    op.execute("ALTER TYPE new_patternenum RENAME TO patternenum;")


def downgrade() -> None:
    """Downgrade schema - restore old PatternEnum values."""
    # Step 1: Create old enum type
    op.execute("""
        CREATE TYPE old_patternenum AS ENUM (
            'PIN_BAR',
            'ENGULFING',
            'EVENING_STAR',
            'MORNING_STAR',
            'DOJI',
            'HEAD_SHOULDERS_TOP',
            'HEAD_SHOULDERS_BOTTOM'
        );
    """)

    # Step 2: Alter pattern_marks table - set null for invalid values, then convert
    op.execute("""
        ALTER TABLE pattern_marks
        ALTER COLUMN pattern_type TYPE old_patternenum
        USING CASE
            WHEN pattern_type::text IN ('HEAD_AND_SHOULDERS_TOP', 'HEAD_AND_SHOULDERS_BOTTOM')
            THEN pattern_type::text::old_patternenum
            ELSE NULL
        END;
    """)

    # Step 3: Alter trade_logs table - set null for invalid values, then convert
    op.execute("""
        ALTER TABLE trade_logs
        ALTER COLUMN pattern_type TYPE old_patternenum
        USING CASE
            WHEN pattern_type::text IN ('HEAD_AND_SHOULDERS_TOP', 'HEAD_AND_SHOULDERS_BOTTOM')
            THEN pattern_type::text::old_patternenum
            ELSE NULL
        END;
    """)

    # Step 4: Drop new enum type
    op.execute("DROP TYPE patternenum;")

    # Step 5: Rename old enum to original name
    op.execute("ALTER TYPE old_patternenum RENAME TO patternenum;")