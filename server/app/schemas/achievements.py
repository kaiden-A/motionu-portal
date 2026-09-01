from pydantic import BaseModel


class AchievementPublic(BaseModel):
    model_config = {"from_attributes": True}

    key: str
    label: str
    desc: str | None = None
    icon: str
    enabled: bool = True


class AchievementCreate(BaseModel):
    label: str
    desc: str | None = None
    icon: str = "star"


class AchievementUpdate(BaseModel):
    label: str | None = None
    desc: str | None = None
    icon: str | None = None
    enabled: bool | None = None


class AchievementAssign(BaseModel):
    """Full replacement of a member's earned achievement keys."""

    keys: list[str]
