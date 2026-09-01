from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_member, require_cap
from app.models import Card, Department, Member
from app.schemas import (
    CardAdmin,
    CardAssignRequest,
    CardCreate,
    CardPublic,
    DirectoryUser,
)
from app.services.cards_service import assign_card, claim_card, get_card_or_404
from app.services.zitadel_service import (
    search_zitadel_users,
    user_display_name,
    user_email,
)

router = APIRouter(prefix="/api/v1/cards", tags=["cards"])


def _department(db: Session, key: str | None):
    if not key:
        return None
    return db.query(Department).filter(Department.key == key).first()


def _to_public(db: Session, card: Card) -> CardPublic:
    member = None
    if card.assigned_zitadel_sub:
        member = (
            db.query(Member).filter(Member.zitadel_sub == card.assigned_zitadel_sub).first()
        )
    return CardPublic(
        card_id=card.card_id,
        uid=card.uid,
        last_tap=card.last_tap,
        assigned=card.assigned_zitadel_sub is not None,
        member=(
            {
                "name": member.name,
                "initials": member.initials,
                "dept": member.dept,
                "role": member.role,
                "roles": member.roles or [],
                "is_active": member.is_active,
                "achievements": member.achievements or [],
                "member_since": member.member_since.isoformat() if member.member_since else None,
                "department": _department(db, member.dept),
            }
            if member
            else None
        ),
    )


@router.get("/directory/list", response_model=list[DirectoryUser])
def directory(db: Session = Depends(get_db), _admin: Member = Depends(require_cap("manage_cards"))):
    """Zitadel user directory (via BOT_TOKEN) for the admin assign dropdown."""
    users = search_zitadel_users(limit=200)
    return [
        DirectoryUser(
            id=u.get("userId") or u.get("id", ""),
            name=user_display_name(u),
            email=user_email(u),
            verified=bool(((u.get("human") or {}).get("email") or {}).get("isVerified")),
        )
        for u in users
        if u.get("state") == "USER_STATE_ACTIVE"
    ]


@router.get("/{card_id}", response_model=CardPublic)
def get_card(card_id: str, db: Session = Depends(get_db)):
    """Public card lookup — no authentication. Never exposes email or sub."""
    return _to_public(db, get_card_or_404(db, card_id))


@router.post("/{card_id}/claim", response_model=CardPublic)
def claim(card_id: str, db: Session = Depends(get_db), member: Member = Depends(get_current_member)):
    """Self-service claim by a signed-in member."""
    return _to_public(db, claim_card(db, card_id, member))


@router.get("", response_model=list[CardAdmin])
def list_cards(db: Session = Depends(get_db), _admin: Member = Depends(require_cap("manage_cards"))):
    cards = db.query(Card).order_by(Card.card_id).all()
    return [
        CardAdmin(
            card_id=c.card_id,
            uid=c.uid,
            last_tap=c.last_tap,
            assigned=c.assigned_zitadel_sub is not None,
            assigned_zitadel_sub=c.assigned_zitadel_sub,
            member=_to_public(db, c).member,
        )
        for c in cards
    ]


@router.post("", response_model=CardAdmin, status_code=status.HTTP_201_CREATED)
def register_card(
    body: CardCreate, db: Session = Depends(get_db), _admin: Member = Depends(require_cap("manage_cards"))
):
    if db.query(Card).filter(Card.card_id == body.card_id).first():
        raise HTTPException(status_code=409, detail="card_id already exists")
    uid = (body.uid or "").strip() or f"PENDING-{body.card_id}"
    if db.query(Card).filter(Card.uid == uid).first():
        raise HTTPException(status_code=409, detail="uid already exists")
    card = Card(card_id=body.card_id, uid=uid)
    db.add(card)
    db.commit()
    db.refresh(card)
    return CardAdmin(
        card_id=card.card_id,
        uid=card.uid,
        last_tap=card.last_tap,
        assigned=False,
        assigned_zitadel_sub=None,
        member=None,
    )


@router.post("/{card_id}/assign", response_model=CardAdmin)
def assign(
    card_id: str,
    body: CardAssignRequest,
    db: Session = Depends(get_db),
    admin: Member = Depends(require_cap("manage_cards")),
):
    card = assign_card(db, card_id, body.zitadel_sub, admin)
    public = _to_public(db, card)
    return CardAdmin(
        card_id=card.card_id,
        uid=card.uid,
        last_tap=card.last_tap,
        assigned=card.assigned_zitadel_sub is not None,
        assigned_zitadel_sub=card.assigned_zitadel_sub,
        member=public.member,
    )
