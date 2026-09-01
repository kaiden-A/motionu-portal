from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NewsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str
    author_name: str
    dept: str | None = None
    pinned: bool = False
    published_at: datetime
    created_at: datetime
    updated_at: datetime


class NewsCreate(BaseModel):
    title: str
    body: str
    dept: str | None = None
    pinned: bool = False


class NewsUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    dept: str | None = None
    pinned: bool | None = None


class EventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    location: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    dept: str | None = None
    created_by_name: str
    created_at: datetime
    updated_at: datetime


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    dept: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    dept: str | None = None
