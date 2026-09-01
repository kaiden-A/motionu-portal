from pydantic import BaseModel, EmailStr, field_validator

ALLOWED_ROLE_KEYS = {
    "member",
    "mainboards",
    "techops",
    "mulcom",
    "Inter",
    "entrep",
}


class PortalUser(BaseModel):
    id: str
    name: str
    email: str
    verified: bool = False
    active: bool = True
    roles: list[str] = []
    dept: str | None = None
    card_id: str | None = None
    in_portal: bool = False


class PortalUserCreate(BaseModel):
    name: str
    email: EmailStr
    roles: list[str] = []

    @field_validator("roles")
    @classmethod
    def _roles_allowed(cls, roles: list[str]) -> list[str]:
        unknown = set(roles) - ALLOWED_ROLE_KEYS
        if unknown:
            raise ValueError(f"Unknown roles: {sorted(unknown)}")
        return roles


class PortalUserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    roles: list[str] | None = None

    @field_validator("roles")
    @classmethod
    def _roles_allowed(cls, roles: list[str] | None) -> list[str] | None:
        if roles is None:
            return roles
        unknown = set(roles) - ALLOWED_ROLE_KEYS
        if unknown:
            raise ValueError(f"Unknown roles: {sorted(unknown)}")
        return roles
