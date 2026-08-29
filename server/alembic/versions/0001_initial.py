"""initial migration: members, cards, departments

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("key", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("short", sa.String(32), nullable=False),
        sa.Column("lead", sa.String(255), nullable=True),
    )

    op.create_table(
        "members",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("zitadel_sub", sa.String(128), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("initials", sa.String(8), nullable=False, server_default=""),
        sa.Column("dept", sa.String(32), nullable=True),
        sa.Column("role", sa.String(128), nullable=True),
        sa.Column("is_admin", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("achievements", sa.JSON, nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("member_since", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "cards",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("card_id", sa.String(32), nullable=False, unique=True),
        sa.Column("uid", sa.String(32), nullable=False, unique=True),
        sa.Column(
            "assigned_zitadel_sub",
            sa.String(128),
            sa.ForeignKey("members.zitadel_sub"),
            nullable=True,
        ),
        sa.Column("last_tap", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_members_zitadel_sub", "members", ["zitadel_sub"])
    op.create_index("ix_cards_card_id", "cards", ["card_id"])
    op.create_index("ix_cards_assigned_zitadel_sub", "cards", ["assigned_zitadel_sub"])


def downgrade() -> None:
    op.drop_table("cards")
    op.drop_table("members")
    op.drop_table("departments")
