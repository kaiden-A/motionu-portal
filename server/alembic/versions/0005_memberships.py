"""membership plans + memberships + apps.staff_only

Revision ID: 0005_memberships
Revises: 0004_apps_simplify_achievements
Create Date: 2026-09-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_memberships"
down_revision: Union[str, None] = "0004_apps_simplify_achievements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "membership_plans",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("desc", sa.Text, nullable=True),
        sa.Column("price_cents", sa.Integer, nullable=True),
        sa.Column("duration_days", sa.Integer, nullable=True),
        sa.Column("benefits", sa.JSON, nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("sort", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_membership_plans_key", "membership_plans", ["key"])

    op.create_table(
        "memberships",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "member_sub",
            sa.String(128),
            sa.ForeignKey("members.zitadel_sub"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "plan_key",
            sa.String(64),
            sa.ForeignKey("membership_plans.key"),
            nullable=True,
        ),
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
        sa.Column("starts_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("auto_renew", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_by_sub", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_memberships_member_sub", "memberships", ["member_sub"])

    op.add_column(
        "apps",
        sa.Column("staff_only", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("apps", "staff_only")
    op.drop_table("memberships")
    op.drop_table("membership_plans")
