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
    roles: list[str] = []
    is_active: bool = True
    achievements: list[str] = []
    member_since: str | None = None
    department: DepartmentPublic | None = None


class MemberDirectoryItem(MemberPublic):
    zitadel_sub: str | None = None


class MemberMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    zitadel_sub: str
    name: str
    email: str
    initials: str
    dept: str | None = None
    role: str | None = None
    roles: list[str] = []
    is_admin: bool = False
    caps: list[str] = []
    achievements: list[str] = []
    card: "CardPublic | None" = None
    membership: "MembershipMe | None" = None
