from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_cap
from app.models import Achievement, Member
from app.schemas import (
    AchievementAssign,
    AchievementCreate,
    AchievementPublic,
    AchievementUpdate,
)
from app.services.text import slugify

router = APIRouter(prefix="/api/v1/achievements", tags=["achievements"])

ACHIEVEMENT_ADMIN = require_cap("manage_achievements")


def _to_public(a: Achievement) -> AchievementPublic:
    return AchievementPublic(
        key=a.key,
        label=a.label,
        desc=a.desc,
        icon=a.icon,
        enabled=a.enabled,
    )


def _get_achievement_or_404(db: Session, key: str) -> Achievement:
    a = db.query(Achievement).filter(Achievement.key == key).first()
    if not a:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return a


def _unique_key(db: Session, label: str) -> str:
    base = slugify(label)
    key = base
    n = 2
    while db.query(Achievement).filter(Achievement.key == key).first():
        key = f"{base}-{n}"
        n += 1
    return key


@router.get("", response_model=list[AchievementPublic])
def list_achievements(db: Session = Depends(get_db)):
    """Public badge catalog (enabled only) — readable without auth so the
    public card page can render earned badges."""
    items = (
        db.query(Achievement)
        .filter(Achievement.enabled.is_(True))
        .order_by(Achievement.label)
        .all()
    )
    return [_to_public(a) for a in items]


@router.get("/all", response_model=list[AchievementPublic])
def list_all_achievements(db: Session = Depends(get_db), _member: Member = Depends(ACHIEVEMENT_ADMIN)):
    """Admin view — all badges including disabled."""
    items = db.query(Achievement).order_by(Achievement.label).all()
    return [_to_public(a) for a in items]


@router.post("", response_model=AchievementPublic, status_code=status.HTTP_201_CREATED)
def create_achievement(
    body: AchievementCreate,
    db: Session = Depends(get_db),
    creator: Member = Depends(ACHIEVEMENT_ADMIN),
):
    achievement = Achievement(
        key=_unique_key(db, body.label),
        label=body.label,
        desc=body.desc,
        icon=body.icon,
        created_by_sub=creator.zitadel_sub,
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return _to_public(achievement)


@router.patch("/{key}", response_model=AchievementPublic)
def update_achievement(
    key: str,
    body: AchievementUpdate,
    db: Session = Depends(get_db),
    _member: Member = Depends(ACHIEVEMENT_ADMIN),
):
    achievement = _get_achievement_or_404(db, key)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(achievement, field, value)
    db.commit()
    db.refresh(achievement)
    return _to_public(achievement)


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_achievement(
    key: str,
    db: Session = Depends(get_db),
    _member: Member = Depends(ACHIEVEMENT_ADMIN),
):
    achievement = _get_achievement_or_404(db, key)
    # Strip the badge from every member that earned it.
    for m in db.query(Member).all():
        if achievement.key in (m.achievements or []):
            m.achievements = [k for k in m.achievements if k != achievement.key]
    db.delete(achievement)
    db.commit()


@router.patch("/members/{zitadel_sub}", response_model=list[str])
def set_member_achievements(
    zitadel_sub: str,
    body: AchievementAssign,
    db: Session = Depends(get_db),
    _member: Member = Depends(ACHIEVEMENT_ADMIN),
):
    """Replace the full set of achievements a member holds."""
    member = db.query(Member).filter(Member.zitadel_sub == zitadel_sub).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in portal")
    known = {a.key for a in db.query(Achievement).all()}
    unknown = set(body.keys) - known
    if unknown:
        raise HTTPException(
            status_code=400, detail=f"Unknown achievements: {sorted(unknown)}"
        )
    member.achievements = list(dict.fromkeys(body.keys))
    db.commit()
    return member.achievements
