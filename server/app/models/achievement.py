from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(128))
    desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(32), default="star")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by_sub: Mapped[str] = mapped_column(
        ForeignKey("members.zitadel_sub"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
