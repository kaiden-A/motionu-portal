import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Member

_ZITADEL_API = settings.zitadel_issuer.rstrip("/")
_ALLOWED_ORG = settings.zitadel_allowed_org_id


class ZitadelError(Exception):
    pass


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.bot_token}"}


def _org_id_of(user: dict) -> str:
    """resourceOwner (org id) of a v2 user payload."""
    return (user.get("details") or {}).get("resourceOwner") or ""


def _assert_allowed_org(user: dict) -> None:
    if _org_id_of(user) != _ALLOWED_ORG:
        raise ZitadelError(
            f"User org {_org_id_of(user)} is not the allowed org {_ALLOWED_ORG}"
        )


def get_zitadel_user(user_id: str) -> dict:
    """GET /v2/users/{id} — full profile for one user, org-restricted."""
    with httpx.Client(timeout=15) as client:
        res = client.get(f"{_ZITADEL_API}/v2/users/{user_id}", headers=_headers())
    if res.status_code != 200:
        raise ZitadelError(f"Zitadel get user failed: {res.status_code} {res.text}")
    user = res.json().get("user") or {}
    _assert_allowed_org(user)
    return user


def search_zitadel_users(limit: int = 200) -> list[dict]:
    """POST /v2/users with an organizationIdQuery — org-scoped directory.

    Uses the v2 API because the v1 management API is scoped to the bot's own
    org; the v2 API can read users of the allowed org via organizationIdQuery.
    """
    body = {
        "query": {"limit": str(limit)},
        "queries": [
            {
                "organizationIdQuery": {
                    "organizationId": _ALLOWED_ORG,
                }
            }
        ],
    }
    with httpx.Client(timeout=20) as client:
        res = client.post(
            f"{_ZITADEL_API}/v2/users",
            headers={**_headers(), "Content-Type": "application/json"},
            json=body,
        )
    if res.status_code != 200:
        raise ZitadelError(f"Zitadel search users failed: {res.status_code} {res.text}")
    return res.json().get("result", [])


def user_display_name(user: dict) -> str:
    human = user.get("human") or {}
    profile = human.get("profile") or {}
    return (
        profile.get("displayName")
        or " ".join(filter(None, [profile.get("givenName"), profile.get("familyName")]))
        or user.get("username")
        or user.get("userId", "Member")
    )


def user_email(user: dict) -> str:
    human = user.get("human") or {}
    email = human.get("email") or {}
    return email.get("email", "")


def user_initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "MU"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def get_or_create_member(db: Session, zitadel_sub: str, user: dict | None = None) -> Member:
    """Provision (or refresh) a Member record from a Zitadel user profile.

    Only users from the allowed org may be provisioned.
    """
    member = db.query(Member).filter(Member.zitadel_sub == zitadel_sub).first()

    if user is None:
        try:
            user = get_zitadel_user(zitadel_sub)
        except ZitadelError:
            user = None

    if user:
        _assert_allowed_org(user)
        name = user_display_name(user)
        email = user_email(user)
    else:
        name = "Motion-U Member"
        email = ""

    if member:
        changed = False
        if user and member.name != name:
            member.name = name
            changed = True
        if user and member.email != email:
            member.email = email
            changed = True
        if changed:
            db.commit()
        return member

    member = Member(
        zitadel_sub=zitadel_sub,
        name=name,
        email=email,
        initials=user_initials(name),
        role="Member",
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member
