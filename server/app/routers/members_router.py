from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    ADMIN_ROLES,
    bearer_scheme,
    get_current_member,
    has_admin_role,
    member_caps,
    _verify_access_token,
)
from app.models import Card, Department, Member, Membership, MembershipPlan
from app.schemas import (
    CardPublic,
    MemberDirectoryItem,
    MemberMe,
    MembershipMe,
    MembershipPlanPublic,
)

router = APIRouter(prefix="/api/v1/members", tags=["members"])


def _department(db: Session, key: str | None):
    if not key:
        return None
    return db.query(Department).filter(Department.key == key).first()


def _to_directory_item(db: Session, member: Member) -> MemberDirectoryItem:
    dept = _department(db, member.dept)
    return MemberDirectoryItem(
        name=member.name,
        initials=member.initials,
        dept=member.dept,
        role=member.role,
        roles=member.roles or [],
        is_active=member.is_active,
        achievements=member.achievements or [],
        member_since=member.member_since.isoformat() if member.member_since else None,
        department=dept,
        zitadel_sub=member.zitadel_sub,
    )


@router.get("", response_model=list[MemberDirectoryItem])
def list_members(db: Session = Depends(get_db), _member: Member = Depends(get_current_member)):
    """Members directory — login required. Includes Zitadel roles.
    Membership program holders are excluded (managed in /memberships)."""
    holder_subs = db.query(Membership.member_sub)
    members = (
        db.query(Member)
        .filter(Member.zitadel_sub.notin_(holder_subs))
        .order_by(Member.name)
        .all()
    )
    return [_to_directory_item(db, m) for m in members]


@router.get("/me", response_model=MemberMe)
def me(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    member: Member = Depends(get_current_member),
):
    card = db.query(Card).filter(Card.assigned_zitadel_sub == member.zitadel_sub).first()
    dept = _department(db, member.dept)

    is_admin = member.is_admin or bool(set(member.roles or []) & ADMIN_ROLES)
    if not is_admin and credentials:
        try:
            payload = _verify_access_token(credentials.credentials)
            is_admin = has_admin_role(payload)
        except HTTPException:
            pass

    card_public = None
    if card:
        card_public = CardPublic(
            card_id=card.card_id,
            uid=card.uid,
            last_tap=card.last_tap,
            assigned=True,
            member={
                "name": member.name,
                "initials": member.initials,
                "dept": member.dept,
                "role": member.role,
                "roles": member.roles or [],
                "is_active": member.is_active,
                "achievements": member.achievements or [],
                "member_since": member.member_since.isoformat() if member.member_since else None,
                "department": dept,
            },
        )

    membership = None
    m = db.query(Membership).filter(Membership.member_sub == member.zitadel_sub).first()
    if m:
        status = m.status
        if (
            status == "active"
            and m.ends_at
            and m.ends_at < datetime.now(timezone.utc)
        ):
            status = "expired"
        plan = None
        if m.plan_key:
            plan = db.query(MembershipPlan).filter(MembershipPlan.key == m.plan_key).first()
        membership = MembershipMe(
            name=member.name,
            email=member.email,
            status=status,
            plan=MembershipPlanPublic.model_validate(plan) if plan else None,
            starts_at=m.starts_at,
            ends_at=m.ends_at,
            auto_renew=m.auto_renew,
            card=card_public,
        )

    return MemberMe(
        name=member.name,
        email=member.email,
        initials=member.initials,
        dept=member.dept,
        role=member.role,
        roles=member.roles or [],
        is_admin=is_admin,
        caps=sorted(member_caps(member)),
        achievements=member.achievements or [],
        card=card_public,
        membership=membership,
    )
