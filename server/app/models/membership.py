from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[int] = mapped_column(primary_key=True)
    member_sub: Mapped[str] = mapped_column(
        ForeignKey("members.zitadel_sub"), unique=True, index=True
    )
    plan_key: Mapped[str | None] = mapped_column(
        ForeignKey("membership_plans.key"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), default="active")
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_sub: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    member: Mapped["Member | None"] = relationship()
    plan: Mapped["MembershipPlan | None"] = relationship()
