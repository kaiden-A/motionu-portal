"""member avatar_url (Google profile picture via Zitadel picture claim)

Revision ID: 0007_member_avatar
Revises: 0006_card_prefs
Create Date: 2026-09-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_member_avatar"
down_revision: Union[str, None] = "0006_card_prefs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column("avatar_url", sa.String(2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("members", "avatar_url")
