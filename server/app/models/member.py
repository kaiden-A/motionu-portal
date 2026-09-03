from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    zitadel_sub: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    initials: Mapped[str] = mapped_column(String(8), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    avatar_synced_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    dept: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[str | None] = mapped_column(String(128), nullable=True)
    roles: Mapped[list] = mapped_column(JSON, default=list)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    achievements: Mapped[list] = mapped_column(JSON, default=list)
    card_skin: Mapped[str] = mapped_column(String(32), default="classic")
    card_accent: Mapped[str | None] = mapped_column(String(16), nullable=True)
    member_since: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    card: Mapped["Card | None"] = relationship(
        back_populates="member", uselist=False, foreign_keys="Card.assigned_zitadel_sub"
    )
