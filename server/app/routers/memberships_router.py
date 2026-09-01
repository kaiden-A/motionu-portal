from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_member, require_cap
from app.models import Card, Department, Member, Membership, MembershipPlan
from app.schemas import (
    MEMBERSHIP_STATUSES,
    CardPublic,
    MembershipAdmin,
    MembershipAssignCard,
    MembershipCreate,
    MembershipMe,
    MembershipPlanCreate,
    MembershipPlanPublic,
    MembershipPlanUpdate,
    MembershipUpdate,
)
from app.services.cards_service import assign_card
from app.services.text import slugify
from app.services.zitadel_service import (
    ZitadelError,
    create_human_user,
    get_or_create_member,
    get_zitadel_user,
    roles_for_user,
    search_zitadel_users,
    set_user_roles,
    user_display_name,
    user_email,
)

router = APIRouter(prefix="/api/v1/memberships", tags=["memberships"])

MEMBERSHIP_ADMIN = require_cap("manage_memberships")

STAFF_ROLES = {"super_admin", "mainboards", "techops", "mulcom", "Inter", "entrep"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _effective_status(m: Membership) -> str:
    """Lazy expiry: an 'active' membership past its end date reads as expired."""
    if m.status == "active" and m.ends_at and m.ends_at < _now():
        return "expired"
    return m.status


def _get_membership_or_404(db: Session, membership_id: int) -> Membership:
    m = db.query(Membership).filter(Membership.id == membership_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Membership not found")
    return m


def _get_plan_or_404(db: Session, key: str) -> MembershipPlan:
    plan = db.query(MembershipPlan).filter(MembershipPlan.key == key).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return plan


def _to_plan(plan: MembershipPlan) -> MembershipPlanPublic:
    return MembershipPlanPublic(
        key=plan.key,
        name=plan.name,
        desc=plan.desc,
        price_cents=plan.price_cents,
        duration_days=plan.duration_days,
        benefits=plan.benefits or [],
        enabled=plan.enabled,
        sort=plan.sort,
    )


def _card_public(db: Session, member: Member) -> CardPublic | None:
    card = db.query(Card).filter(Card.assigned_zitadel_sub == member.zitadel_sub).first()
    if not card:
        return None
    dept = None
    if member.dept:
        dept = db.query(Department).filter(Department.key == member.dept).first()
    return CardPublic(
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


def _to_admin(db: Session, m: Membership) -> MembershipAdmin:
    member = db.query(Member).filter(Member.zitadel_sub == m.member_sub).first()
    card = db.query(Card).filter(Card.assigned_zitadel_sub == m.member_sub).first()
    plan = None
    if m.plan_key:
        plan = db.query(MembershipPlan).filter(MembershipPlan.key == m.plan_key).first()
    return MembershipAdmin(
        id=m.id,
        member_sub=m.member_sub,
        plan_key=m.plan_key,
        status=_effective_status(m),
        starts_at=m.starts_at,
        ends_at=m.ends_at,
        auto_renew=m.auto_renew,
        notes=m.notes,
        name=member.name if member else "Unknown",
        email=member.email if member else "",
        card_id=card.card_id if card else None,
        plan=_to_plan(plan) if plan else None,
    )


def _find_user_by_email(email: str) -> dict | None:
    try:
        users = search_zitadel_users(limit=200)
    except ZitadelError:
        return None
    needle = email.strip().lower()
    for u in users:
        if user_email(u).strip().lower() == needle:
            return u
    return None


# --- Plans -----------------------------------------------------------------


@router.get("/plans", response_model=list[MembershipPlanPublic])
def list_plans(db: Session = Depends(get_db), _admin: Member = Depends(MEMBERSHIP_ADMIN)):
    plans = db.query(MembershipPlan).order_by(MembershipPlan.sort, MembershipPlan.name).all()
    return [_to_plan(p) for p in plans]


@router.post("/plans", response_model=MembershipPlanPublic, status_code=status.HTTP_201_CREATED)
def create_plan(
    body: MembershipPlanCreate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    key = slugify(body.name)
    base = key
    n = 2
    while db.query(MembershipPlan).filter(MembershipPlan.key == key).first():
        key = f"{base}-{n}"
        n += 1
    plan = MembershipPlan(key=key, **body.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _to_plan(plan)


@router.patch("/plans/{key}", response_model=MembershipPlanPublic)
def update_plan(
    key: str,
    body: MembershipPlanUpdate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    plan = _get_plan_or_404(db, key)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return _to_plan(plan)


@router.delete("/plans/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(key: str, db: Session = Depends(get_db), _admin: Member = Depends(MEMBERSHIP_ADMIN)):
    plan = _get_plan_or_404(db, key)
    if db.query(Membership).filter(Membership.plan_key == key).first():
        raise HTTPException(
            status_code=409, detail="Plan is in use by memberships — update them first"
        )
    db.delete(plan)
    db.commit()


# --- Memberships -----------------------------------------------------------


@router.get("", response_model=list[MembershipAdmin])
def list_memberships(
    search: str | None = None,
    mstatus: str | None = None,
    db: Session = Depends(get_db),
    _admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    """Admin list — search by name/email, optional status filter."""
    if mstatus and mstatus not in MEMBERSHIP_STATUSES:
        raise HTTPException(status_code=422, detail=f"Unknown status '{mstatus}'")
    q = db.query(Membership)
    if search:
        like = f"%{search.strip()}%"
        q = q.join(Member, Member.zitadel_sub == Membership.member_sub).filter(
            or_(Member.name.ilike(like), Member.email.ilike(like))
        )
    if mstatus:
        q = q.filter(Membership.status == mstatus)
    rows = q.order_by(Membership.created_at.desc()).all()
    return [_to_admin(db, m) for m in rows]


@router.get("/me", response_model=MembershipMe)
def my_membership(
    db: Session = Depends(get_db),
    member: Member = Depends(get_current_member),
):
    """Signed-in membership holder's own view — plan, status, card, benefits."""
    m = db.query(Membership).filter(Membership.member_sub == member.zitadel_sub).first()
    if not m:
        raise HTTPException(status_code=404, detail="No membership record for this user")
    plan = None
    if m.plan_key:
        plan = db.query(MembershipPlan).filter(MembershipPlan.key == m.plan_key).first()
    return MembershipMe(
        name=member.name,
        email=member.email,
        status=_effective_status(m),
        plan=_to_plan(plan) if plan else None,
        starts_at=m.starts_at,
        ends_at=m.ends_at,
        auto_renew=m.auto_renew,
        card=_card_public(db, member),
    )


@router.post("", response_model=MembershipAdmin, status_code=status.HTTP_201_CREATED)
def create_membership(
    body: MembershipCreate,
    db: Session = Depends(get_db),
    admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    """Create a membership holder: ensure a Zitadel user exists (granting the
    `membership` role), provision the portal member, and record the plan."""
    if body.status not in MEMBERSHIP_STATUSES:
        raise HTTPException(status_code=422, detail=f"Unknown status '{body.status}'")

    plan = None
    if body.plan_key:
        plan = _get_plan_or_404(db, body.plan_key)

    user = _find_user_by_email(str(body.email))
    if user:
        user_id = user.get("userId") or user.get("id", "")
    else:
        try:
            user_id = create_human_user(body.name, str(body.email))
        except ZitadelError as e:
            raise HTTPException(status_code=502, detail=str(e))

    if db.query(Membership).filter(Membership.member_sub == user_id).first():
        raise HTTPException(
            status_code=409, detail="This user already has a membership record"
        )

    try:
        roles = roles_for_user(user_id)
    except ZitadelError:
        roles = ["member"]
    if "membership" not in roles:
        roles.append("membership")
    try:
        set_user_roles(user_id, roles)
    except ZitadelError as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        user = get_zitadel_user(user_id)
    except ZitadelError:
        user = None

    member = get_or_create_member(db, user_id, user)

    starts_at = body.starts_at or _now()
    ends_at = body.ends_at
    if ends_at is None and plan and plan.duration_days:
        ends_at = starts_at + timedelta(days=plan.duration_days)

    m = Membership(
        member_sub=member.zitadel_sub,
        plan_key=body.plan_key,
        status=body.status,
        starts_at=starts_at,
        ends_at=ends_at,
        auto_renew=body.auto_renew,
        notes=body.notes,
        created_by_sub=admin.zitadel_sub,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _to_admin(db, m)


@router.patch("/{membership_id}", response_model=MembershipAdmin)
def update_membership(
    membership_id: int,
    body: MembershipUpdate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    m = _get_membership_or_404(db, membership_id)
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in MEMBERSHIP_STATUSES:
        raise HTTPException(status_code=422, detail=f"Unknown status '{data['status']}'")
    if "plan_key" in data and data["plan_key"] is not None:
        _get_plan_or_404(db, data["plan_key"])
    for field, value in data.items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return _to_admin(db, m)


@router.post("/{membership_id}/assign-card", response_model=MembershipAdmin)
def assign_membership_card(
    membership_id: int,
    body: MembershipAssignCard,
    db: Session = Depends(get_db),
    admin: Member = Depends(MEMBERSHIP_ADMIN),
):
    """Assign an unassigned card to the holder, or unassign the holder's
    current card by sending card_id: null."""
    m = _get_membership_or_404(db, membership_id)
    if body.card_id:
        assign_card(db, body.card_id, m.member_sub, admin)
    else:
        card = db.query(Card).filter(Card.assigned_zitadel_sub == m.member_sub).first()
        if card:
            assign_card(db, card.card_id, None, admin)
    db.refresh(m)
    return _to_admin(db, m)
