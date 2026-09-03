"""member avatar_synced_url (last Google picture uploaded to Zitadel)

Revision ID: 0008_avatar_synced
Revises: 0007_member_avatar
Create Date: 2026-09-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_avatar_synced"
down_revision: Union[str, None] = "0007_member_avatar"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column("avatar_synced_url", sa.String(2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("members", "avatar_synced_url")
