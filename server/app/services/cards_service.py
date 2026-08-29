from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models import Card, Member
from app.services.zitadel_service import get_or_create_member


def get_card_or_404(db: Session, card_id: str) -> Card:
    card = db.query(Card).filter(Card.card_id == card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    return card


def claim_card(db: Session, card_id: str, member: Member) -> Card:
    """Self-service claim: assign this card to the member atomically.

    Rules: card must be unassigned, and the member must not already hold a card.
    """
    existing = db.query(Card).filter(Card.assigned_zitadel_sub == member.zitadel_sub).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already hold {existing.card_id}",
        )

    result = db.execute(
        update(Card)
        .where(Card.card_id == card_id, Card.assigned_zitadel_sub.is_(None))
        .values(assigned_zitadel_sub=member.zitadel_sub)
    )
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Card is already assigned"
        )
    db.commit()
    return get_card_or_404(db, card_id)


def assign_card(db: Session, card_id: str, zitadel_sub: str | None, admin: Member) -> Card:
    """Admin assignment: assign a card to a Zitadel user (auto-provisions the
    member) or unassign it by passing zitadel_sub=None."""
    card = get_card_or_404(db, card_id)

    if zitadel_sub is None:
        if card.assigned_zitadel_sub and card.assigned_zitadel_sub == admin.zitadel_sub:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot unassign a card you hold",
            )
        card.assigned_zitadel_sub = None
        db.commit()
        return card

    if card.assigned_zitadel_sub:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Card is already assigned — unassign it first",
        )

    member = get_or_create_member(db, zitadel_sub)
    holder = db.query(Card).filter(Card.assigned_zitadel_sub == zitadel_sub).first()
    if holder:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{member.name} already holds {holder.card_id}",
        )

    card.assigned_zitadel_sub = zitadel_sub
    db.commit()
    return card
