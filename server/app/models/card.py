from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    card_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    uid: Mapped[str] = mapped_column(String(32), unique=True)
    assigned_zitadel_sub: Mapped[str | None] = mapped_column(
        ForeignKey("members.zitadel_sub"), nullable=True, index=True
    )
    last_tap: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    member: Mapped["Member | None"] = relationship(
        back_populates="card", foreign_keys=[assigned_zitadel_sub]
    )
