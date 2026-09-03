from pydantic import BaseModel, ConfigDict, field_validator
import re

SKIN_RE = re.compile(r"^[a-z0-9_-]{1,32}$")
ACCENT_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


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
    avatar_url: str | None = None
    dept: str | None = None
    role: str | None = None
    roles: list[str] = []
    is_active: bool = True
    achievements: list[str] = []
    card_skin: str = "classic"
    card_accent: str | None = None
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
    avatar_url: str | None = None
    dept: str | None = None
    role: str | None = None
    roles: list[str] = []
    is_admin: bool = False
    caps: list[str] = []
    achievements: list[str] = []
    card_skin: str = "classic"
    card_accent: str | None = None
    card: "CardPublic | None" = None
    membership: "MembershipMe | None" = None


SKIN_RE = re.compile(r"^[a-z0-9_-]{1,32}$")
ACCENT_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class CardPrefsUpdate(BaseModel):
    """A member's own card design preferences."""

    skin: str | None = None
    accent: str | None = None

    @field_validator("skin")
    @classmethod
    def _check_skin(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v or not SKIN_RE.match(v):
            raise ValueError("skin must be 1-32 chars of a-z, 0-9, _ or -")
        return v

    @field_validator("accent")
    @classmethod
    def _check_accent(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not ACCENT_RE.match(v):
            raise ValueError("accent must be a hex color like #ff5a3c")
        return v.lower()
