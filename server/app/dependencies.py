import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Member
from app.services.zitadel_service import get_or_create_member

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_client = PyJWKClient(settings.zitadel_jwks_uri, cache_keys=True)

# Roles that allow card assignment (project "Motion-U Internal Apps").
ADMIN_ROLES = {"super_admin", "mainboards", "Inter"}


def _verify_access_token(token: str) -> dict:
    """Verify a Zitadel access token via remote JWKS, pinning issuer + audience."""
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            issuer=settings.zitadel_issuer,
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}"
        )

    # Audience check — accept the token if the configured audience appears
    # in the token's aud claim (Zitadel includes the project id in aud).
    aud = payload.get("aud")
    if isinstance(aud, list):
        aud = ",".join(aud)
    if not aud or settings.zitadel_audience not in str(aud):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token audience mismatch"
        )

    return payload


def _check_org(payload: dict) -> None:
    """Only members of the allowed org may use the portal."""
    org_id = payload.get("urn:zitadel:iam:user:resourceowner:id")
    if not org_id or org_id != settings.zitadel_allowed_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User org not allowed"
        )


def _check_role(payload: dict) -> None:
    """Enforce the configured Zitadel role if the claim is present."""
    roles = payload.get("urn:zitadel:iam:org:project:roles")
    if not roles:
        return
    role_names = list(roles.keys()) if isinstance(roles, dict) else [roles]
    if settings.zitadel_required_role not in role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{settings.zitadel_required_role}' required",
        )


def get_token_roles(payload: dict) -> set[str]:
    roles = payload.get("urn:zitadel:iam:org:project:roles")
    if isinstance(roles, dict):
        return set(roles.keys())
    if isinstance(roles, list):
        return set(roles)
    return set()


def has_admin_role(payload: dict) -> bool:
    return bool(get_token_roles(payload) & ADMIN_ROLES)


def get_current_member(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Member:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    payload = _verify_access_token(credentials.credentials)
    _check_org(payload)
    _check_role(payload)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject"
        )
    return get_or_create_member(db, sub)


def get_admin_member(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    member: Member = Depends(get_current_member),
) -> Member:
    """Card/app management requires one of the admin roles (super_admin,
    mainboards, Inter) — from the member's synced Zitadel roles, the access
    token, or the DB is_admin flag."""
    if member.is_admin or bool(set(member.roles or []) & ADMIN_ROLES):
        return member
    if credentials:
        payload = _verify_access_token(credentials.credentials)
        if has_admin_role(payload):
            return member
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin role (super_admin, mainboards, Inter) required",
    )
