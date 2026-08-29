from pydantic import BaseModel


class AppPublic(BaseModel):
    model_config = {"from_attributes": True}

    app_id: str
    name: str
    desc: str | None = None
    category: str
    dept: str | None = None
    icon: str
    url: str | None = None
    enabled: bool = True


class AppCreate(BaseModel):
    app_id: str
    name: str
    desc: str | None = None
    category: str = "Internal"
    dept: str | None = None
    icon: str = "grid"
    url: str | None = None
    enabled: bool = True


class AppUpdate(BaseModel):
    name: str | None = None
    desc: str | None = None
    category: str | None = None
    dept: str | None = None
    icon: str | None = None
    url: str | None = None
    enabled: bool | None = None
