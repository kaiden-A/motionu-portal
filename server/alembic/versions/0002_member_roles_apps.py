"""add member roles + apps table

Revision ID: 0002_member_roles_apps
Revises: 0001_initial
Create Date: 2026-08-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_member_roles_apps"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column("roles", sa.JSON, nullable=False, server_default=sa.text("'[]'::json")),
    )

    op.create_table(
        "apps",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("app_id", sa.String(64), nullable=False, unique=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("desc", sa.String(512), nullable=True),
        sa.Column("category", sa.String(16), nullable=False, server_default="Internal"),
        sa.Column("dept", sa.String(32), nullable=True),
        sa.Column("icon", sa.String(32), nullable=False, server_default="grid"),
        sa.Column("url", sa.String(512), nullable=True),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("sort", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_apps_app_id", "apps", ["app_id"])


def downgrade() -> None:
    op.drop_table("apps")
    op.drop_column("members", "roles")
