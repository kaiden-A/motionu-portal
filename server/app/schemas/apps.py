from pydantic import BaseModel


class AppPublic(BaseModel):
    model_config = {"from_attributes": True}

    app_id: str
    name: str
    desc: str | None = None
    icon: str
    url: str | None = None
    enabled: bool = True
    staff_only: bool = False


class AppCreate(BaseModel):
    name: str
    desc: str | None = None
    icon: str = "grid"
    url: str | None = None
    enabled: bool = True
    staff_only: bool = False


class AppUpdate(BaseModel):
    name: str | None = None
    desc: str | None = None
    icon: str | None = None
    url: str | None = None
    enabled: bool | None = None
    staff_only: bool | None = None
