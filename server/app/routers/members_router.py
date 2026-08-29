from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    bearer_scheme,
    get_current_member,
    has_admin_role,
    _verify_access_token,
)
from app.models import Card, Department, Member
from app.schemas import CardPublic, MemberMe

router = APIRouter(prefix="/api/v1/members", tags=["members"])


@router.get("/me", response_model=MemberMe)
def me(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    member: Member = Depends(get_current_member),
):
    card = db.query(Card).filter(Card.assigned_zitadel_sub == member.zitadel_sub).first()
    dept = (
        db.query(Department).filter(Department.key == member.dept).first()
        if member.dept
        else None
    )

    is_admin = member.is_admin
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
                "achievements": member.achievements or [],
                "member_since": member.member_since.isoformat() if member.member_since else None,
                "department": dept,
            },
        )
    return MemberMe(
        name=member.name,
        email=member.email,
        initials=member.initials,
        dept=member.dept,
        role=member.role,
        is_admin=is_admin,
        achievements=member.achievements or [],
        card=card_public,
    )
