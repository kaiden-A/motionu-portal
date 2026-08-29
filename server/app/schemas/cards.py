from pydantic import BaseModel

from app.schemas.members import MemberPublic


class CardPublic(BaseModel):
    model_config = {"from_attributes": True}

    card_id: str
    uid: str
    last_tap: str | None = None
    assigned: bool = False
    member: MemberPublic | None = None


class CardAdmin(CardPublic):
    assigned_zitadel_sub: str | None = None


class CardCreate(BaseModel):
    card_id: str
    uid: str


class CardAssignRequest(BaseModel):
    zitadel_sub: str | None = None


class DirectoryUser(BaseModel):
    id: str
    name: str
    email: str
    verified: bool = False
