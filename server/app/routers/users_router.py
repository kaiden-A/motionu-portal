from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_cap
from app.models import Card, Member
from app.schemas import PortalUser, PortalUserCreate, PortalUserUpdate
from app.services.zitadel_service import (
    ZitadelError,
    create_human_user,
    deactivate_user,
    get_or_create_member,
    get_zitadel_user,
    is_user_active,
    primary_dept,
    primary_role_display,
    reactivate_user,
    search_zitadel_users,
    set_user_roles,
    sync_member_from_zitadel,
    update_user_profile,
    user_display_name,
    user_email,
)

router = APIRouter(prefix="/api/v1/users", tags=["users"])

USER_ADMIN = require_cap("manage_users")


def _apply_roles(member: Member, roles: list[str]) -> None:
    if "member" not in roles:
        roles = ["member", *roles]
    member.roles = roles
    member.dept = primary_dept(roles)
    member.role = primary_role_display(roles)


def _to_portal(db: Session, user: dict) -> PortalUser:
    user_id = user.get("userId") or user.get("id", "")
    member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
    card = db.query(Card).filter(Card.assigned_zitadel_sub == user_id).first()
    email_obj = (user.get("human") or {}).get("email") or {}
    return PortalUser(
        id=user_id,
        name=user_display_name(user),
        email=user_email(user),
        verified=bool(email_obj.get("isVerified")),
        active=is_user_active(user),
        roles=member.roles or [] if member else [],
        dept=member.dept if member else None,
        card_id=card.card_id if card else None,
        in_portal=member is not None,
    )


@router.get("", response_model=list[PortalUser])
def list_users(db: Session = Depends(get_db), _admin: Member = Depends(USER_ADMIN)):
    """Full Zitadel directory merged with portal state (roles, card link)."""
    users = search_zitadel_users(limit=200)
    return [_to_portal(db, u) for u in users]


@router.post("", response_model=PortalUser, status_code=status.HTTP_201_CREATED)
def create_user(
    body: PortalUserCreate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(USER_ADMIN),
):
    """Create a user in Zitadel (no email notification), assign roles, and
    provision the portal member record — zitadel_sub links any future card."""
    try:
        user_id = create_human_user(body.name, body.email)
    except ZitadelError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if body.roles:
        try:
            set_user_roles(user_id, body.roles)
        except ZitadelError as e:
            raise HTTPException(status_code=502, detail=str(e))

    try:
        user = get_zitadel_user(user_id)
    except ZitadelError:
        user = None

    member = get_or_create_member(db, user_id, user)
    _apply_roles(member, body.roles)
    if user:
        member.is_active = is_user_active(user)
    db.commit()
    db.refresh(member)
    card = db.query(Card).filter(Card.assigned_zitadel_sub == user_id).first()
    return PortalUser(
        id=user_id,
        name=member.name,
        email=str(body.email),
        verified=True,
        active=member.is_active,
        roles=member.roles or [],
        dept=member.dept,
        card_id=card.card_id if card else None,
        in_portal=True,
    )


@router.patch("/{user_id}", response_model=PortalUser)
def update_user(
    user_id: str,
    body: PortalUserUpdate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(USER_ADMIN),
):
    """Edit name/email/roles in Zitadel, then mirror into the portal DB.
    The member's zitadel_sub is untouched, so card assignments survive."""
    try:
        if body.name or body.email:
            update_user_profile(user_id, body.name, body.email)
        if body.roles is not None:
            # super_admin is granted only in Zitadel itself — never assign it
            # here, and never let a portal edit strip it from an existing holder.
            existing_member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
            roles = list(body.roles)
            if existing_member and "super_admin" in (existing_member.roles or []):
                if "super_admin" not in roles:
                    roles.append("super_admin")
            set_user_roles(user_id, roles)
            body.roles = roles
    except ZitadelError as e:
        raise HTTPException(status_code=502, detail=str(e))

    member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
    if member:
        sync_member_from_zitadel(db, member)
        if body.roles is not None:
            _apply_roles(member, body.roles)
            db.commit()
            db.refresh(member)

    try:
        user = get_zitadel_user(user_id)
    except ZitadelError:
        user = None
    if user is None:
        raise HTTPException(status_code=404, detail="User not found in Zitadel")
    return _to_portal(db, user)


@router.post("/{user_id}/deactivate", response_model=PortalUser)
def deactivate(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: Member = Depends(USER_ADMIN),
):
    """Suspend the user in Zitadel — blocks sign-in across every system that
    uses Zitadel SSO. Portal record and card history are kept."""
    try:
        deactivate_user(user_id)
    except ZitadelError as e:
        raise HTTPException(status_code=502, detail=str(e))
    member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
    if member:
        member.is_active = False
        db.commit()
    user = get_zitadel_user(user_id)
    return _to_portal(db, user)


@router.post("/{user_id}/reactivate", response_model=PortalUser)
def reactivate(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: Member = Depends(USER_ADMIN),
):
    try:
        reactivate_user(user_id)
    except ZitadelError as e:
        raise HTTPException(status_code=502, detail=str(e))
    member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
    if member:
        member.is_active = True
        db.commit()
    user = get_zitadel_user(user_id)
    return _to_portal(db, user)
