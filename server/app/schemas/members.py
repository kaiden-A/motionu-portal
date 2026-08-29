from pydantic import BaseModel, ConfigDict


class DepartmentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    name: str
    short: str


class MemberPublic(BaseModel):
    """Public member profile — no email, no Zitadel ID."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    initials: str
    dept: str | None = None
    role: str | None = None
    achievements: list[str] = []
    member_since: str | None = None
    department: DepartmentPublic | None = None


class MemberMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    email: str
    initials: str
    dept: str | None = None
    role: str | None = None
    is_admin: bool = False
    achievements: list[str] = []
    card: "CardPublic | None" = None
