from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_member, require_cap
from app.models import Event, Member, News
from app.schemas import (
    EventCreate,
    EventPublic,
    EventUpdate,
    NewsCreate,
    NewsPublic,
    NewsUpdate,
)

router = APIRouter(prefix="/api/v1", tags=["news"])


def _news_public(db: Session, n: News) -> NewsPublic:
    author = db.query(Member).filter(Member.zitadel_sub == n.author_sub).first()
    return NewsPublic(
        id=n.id,
        title=n.title,
        body=n.body,
        author_name=author.name if author else "Motion-U",
        dept=n.dept,
        pinned=n.pinned,
        published_at=n.published_at,
        created_at=n.created_at,
        updated_at=n.updated_at,
    )


def _event_public(db: Session, e: Event) -> EventPublic:
    creator = db.query(Member).filter(Member.zitadel_sub == e.created_by_sub).first()
    return EventPublic(
        id=e.id,
        title=e.title,
        description=e.description,
        location=e.location,
        starts_at=e.starts_at,
        ends_at=e.ends_at,
        dept=e.dept,
        created_by_name=creator.name if creator else "Motion-U",
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


def _get_news_or_404(db: Session, news_id: int) -> News:
    n = db.query(News).filter(News.id == news_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="News not found")
    return n


def _get_event_or_404(db: Session, event_id: int) -> Event:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return e


@router.get("/news", response_model=list[NewsPublic])
def list_news(db: Session = Depends(get_db), _member: Member = Depends(get_current_member)):
    items = (
        db.query(News)
        .order_by(News.pinned.desc(), News.published_at.desc())
        .all()
    )
    return [_news_public(db, n) for n in items]


@router.get("/news/{news_id}", response_model=NewsPublic)
def get_news(news_id: int, db: Session = Depends(get_db), _member: Member = Depends(get_current_member)):
    return _news_public(db, _get_news_or_404(db, news_id))


@router.post("/news", response_model=NewsPublic, status_code=status.HTTP_201_CREATED)
def create_news(
    body: NewsCreate,
    db: Session = Depends(get_db),
    author: Member = Depends(require_cap("manage_news")),
):
    news = News(
        title=body.title,
        body=body.body,
        author_sub=author.zitadel_sub,
        dept=body.dept,
        pinned=body.pinned,
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return _news_public(db, news)


@router.patch("/news/{news_id}", response_model=NewsPublic)
def update_news(
    news_id: int,
    body: NewsUpdate,
    db: Session = Depends(get_db),
    _member: Member = Depends(require_cap("manage_news")),
):
    news = _get_news_or_404(db, news_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(news, field, value)
    db.commit()
    db.refresh(news)
    return _news_public(db, news)


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    _member: Member = Depends(require_cap("manage_news")),
):
    db.delete(_get_news_or_404(db, news_id))
    db.commit()


@router.get("/events", response_model=list[EventPublic])
def list_events(db: Session = Depends(get_db), _member: Member = Depends(get_current_member)):
    items = (
        db.query(Event)
        .order_by(Event.starts_at)
        .all()
    )
    return [_event_public(db, e) for e in items]


@router.post("/events", response_model=EventPublic, status_code=status.HTTP_201_CREATED)
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    creator: Member = Depends(require_cap("manage_news")),
):
    event = Event(
        title=body.title,
        description=body.description,
        location=body.location,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        dept=body.dept,
        created_by_sub=creator.zitadel_sub,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_public(db, event)


@router.patch("/events/{event_id}", response_model=EventPublic)
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    _member: Member = Depends(require_cap("manage_news")),
):
    event = _get_event_or_404(db, event_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _event_public(db, event)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _member: Member = Depends(require_cap("manage_news")),
):
    db.delete(_get_event_or_404(db, event_id))
    db.commit()
