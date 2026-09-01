"""apps simplify (drop category/dept) + achievements table

Revision ID: 0004_apps_simplify_achievements
Revises: 0003_news_events
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_apps_simplify_achievements"
down_revision: Union[str, None] = "0003_news_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("apps", "category")
    op.drop_column("apps", "dept")

    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("desc", sa.Text, nullable=True),
        sa.Column("icon", sa.String(32), nullable=False, server_default="star"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_by_sub",
            sa.String(128),
            sa.ForeignKey("members.zitadel_sub"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_achievements_key", "achievements", ["key"])
    op.create_index("ix_achievements_created_by_sub", "achievements", ["created_by_sub"])


def downgrade() -> None:
    op.drop_table("achievements")
    op.add_column(
        "apps",
        sa.Column("category", sa.String(16), nullable=False, server_default="Internal"),
    )
    op.add_column("apps", sa.Column("dept", sa.String(32), nullable=True))
