from datetime import datetime

from pydantic import BaseModel, EmailStr

MEMBERSHIP_STATUSES = {"pending", "active", "expired", "cancelled"}


class MembershipPlanPublic(BaseModel):
    model_config = {"from_attributes": True}

    key: str
    name: str
    desc: str | None = None
    price_cents: int | None = None
    duration_days: int | None = None
    benefits: list[str] = []
    enabled: bool = True
    sort: int = 0


class MembershipPlanCreate(BaseModel):
    name: str
    desc: str | None = None
    price_cents: int | None = None
    duration_days: int | None = None
    benefits: list[str] = []
    enabled: bool = True
    sort: int = 0


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    desc: str | None = None
    price_cents: int | None = None
    duration_days: int | None = None
    benefits: list[str] | None = None
    enabled: bool | None = None
    sort: int | None = None


class MembershipPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    member_sub: str
    plan_key: str | None = None
    status: str
    starts_at: datetime
    ends_at: datetime | None = None
    auto_renew: bool = False
    notes: str | None = None


class MembershipCreate(BaseModel):
    name: str
    email: EmailStr
    plan_key: str | None = None
    status: str = "active"
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    auto_renew: bool = False
    notes: str | None = None


class MembershipUpdate(BaseModel):
    plan_key: str | None = None
    status: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    auto_renew: bool | None = None
    notes: str | None = None


class MembershipAssignCard(BaseModel):
    """Assign an unassigned card to the membership holder, or unassign the
    holder's current card by passing card_id=None."""

    card_id: str | None = None


class MembershipMe(BaseModel):
    name: str
    email: str
    status: str
    plan: MembershipPlanPublic | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    auto_renew: bool = False
    card: "CardPublic | None" = None


class MembershipAdmin(MembershipPublic):
    name: str
    email: str
    card_id: str | None = None
    plan: MembershipPlanPublic | None = None
