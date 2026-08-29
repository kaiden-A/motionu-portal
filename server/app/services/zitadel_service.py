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


# Role key -> primary department mapping (project "Motion-U Internal Apps").
ROLE_DEPT_MAP = {
    "mainboards": "mainboard",
    "techops": "techops",
    "mulcom": "multimedia",
    "Inter": "internal",
    "entrep": "entrepreneur",
}

ROLE_DISPLAY = {
    "super_admin": "Admin",
    "member": "Member",
    "mainboards": "Mainboards",
    "techops": "Technical Operations",
    "mulcom": "Multimedia And Communications",
    "Inter": "Internal Affairs",
    "entrep": "Entrepreneurship",
}

# Priority order used to pick the primary department when a member holds
# several department roles.
_DEPT_PRIORITY = ["mainboards", "techops", "mulcom", "Inter", "entrep"]


def primary_dept(roles: list[str]) -> str | None:
    for key in _DEPT_PRIORITY:
        if key in roles:
            return ROLE_DEPT_MAP[key]
    return None


def primary_role_display(roles: list[str]) -> str:
    if not roles:
        return "Member"
    if "super_admin" in roles:
        return "Admin"
    return ROLE_DISPLAY.get(roles[0], roles[0])


def list_org_role_grants(limit: int = 200) -> dict[str, list[str]]:
    """zitadel.authorization.v2.AuthorizationService/ListAuthorizations for the
    allowed org — returns { user_id: [role_keys] }."""
    body = {
        "pagination": {"limit": limit},
        "filters": [{"organization_id": {"id": _ALLOWED_ORG}}],
    }
    with httpx.Client(timeout=20) as client:
        res = client.post(
            f"{_ZITADEL_API}/zitadel.authorization.v2.AuthorizationService/ListAuthorizations",
            headers={**_headers(), "Content-Type": "application/json"},
            json=body,
        )
    if res.status_code != 200:
        raise ZitadelError(f"Zitadel list role grants failed: {res.status_code} {res.text}")
    grants: dict[str, list[str]] = {}
    for auth in res.json().get("authorizations", []):
        user = auth.get("user") or {}
        uid = user.get("id")
        if not uid:
            continue
        roles = [r.get("key") for r in (auth.get("roles") or []) if r.get("key")]
        grants.setdefault(uid, [])
        for r in roles:
            if r not in grants[uid]:
                grants[uid].append(r)
    return grants


def roles_for_user(zitadel_sub: str) -> list[str]:
    return list_org_role_grants().get(zitadel_sub, ["member"])


def _sync_roles(member: Member, roles: list[str] | None) -> None:
    """Apply role keys to a member; keep 'member' always present, derive dept."""
    if roles is None:
        roles = ["member"]
    if "member" not in roles:
        roles = ["member", *roles]
    member.roles = roles
    member.dept = primary_dept(roles)
    member.role = primary_role_display(roles)


def get_or_create_member(db: Session, zitadel_sub: str, user: dict | None = None) -> Member:
    """Provision (or refresh) a Member record from a Zitadel user profile.

    Roles are synced from Zitadel role grants; only users from the allowed
    org may be provisioned.
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

    try:
        roles = roles_for_user(zitadel_sub)
    except ZitadelError:
        roles = None

    if member:
        changed = False
        if user and member.name != name:
            member.name = name
            changed = True
        if user and member.email != email:
            member.email = email
            changed = True
        if roles is not None and (member.roles or []) != roles:
            _sync_roles(member, roles)
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
        roles=["member"],
    )
    if roles is not None:
        _sync_roles(member, roles)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member
