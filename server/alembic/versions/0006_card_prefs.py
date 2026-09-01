"""member card design prefs (skin + accent)

Revision ID: 0006_card_prefs
Revises: 0005_memberships
Create Date: 2026-09-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_card_prefs"
down_revision: Union[str, None] = "0005_memberships"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column("card_skin", sa.String(32), nullable=False, server_default=sa.text("'classic'")),
    )
    op.add_column(
        "members",
        sa.Column("card_accent", sa.String(16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("members", "card_accent")
    op.drop_column("members", "card_skin")
