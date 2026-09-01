from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_cap
from app.models import App, Member
from app.schemas import AppCreate, AppPublic, AppUpdate
from app.services.text import slugify

router = APIRouter(prefix="/api/v1/apps", tags=["apps"])

APP_ADMIN = require_cap("manage_apps")


def _to_public(app: App) -> AppPublic:
    return AppPublic(
        app_id=app.app_id,
        name=app.name,
        desc=app.desc,
        icon=app.icon,
        url=app.url,
        enabled=app.enabled,
    )


def _get_app_or_404(db: Session, app_id: str) -> App:
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


def _unique_app_id(db: Session, name: str) -> str:
    base = slugify(name)
    app_id = base
    n = 2
    while db.query(App).filter(App.app_id == app_id).first():
        app_id = f"{base}-{n}"
        n += 1
    return app_id


@router.get("", response_model=list[AppPublic])
def list_apps(db: Session = Depends(get_db)):
    """Public app catalog — enabled apps only, sorted."""
    apps = (
        db.query(App)
        .filter(App.enabled.is_(True))
        .order_by(App.sort, App.name)
        .all()
    )
    return [_to_public(a) for a in apps]


@router.get("/all", response_model=list[AppPublic])
def list_all_apps(db: Session = Depends(get_db), _admin: Member = Depends(APP_ADMIN)):
    """Admin view — all apps including disabled."""
    apps = db.query(App).order_by(App.sort, App.name).all()
    return [_to_public(a) for a in apps]


@router.post("", response_model=AppPublic, status_code=status.HTTP_201_CREATED)
def create_app(body: AppCreate, db: Session = Depends(get_db), _admin: Member = Depends(APP_ADMIN)):
    """Create an app. app_id is generated from the name — no manual id needed."""
    app = App(app_id=_unique_app_id(db, body.name), **body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return _to_public(app)


@router.patch("/{app_id}", response_model=AppPublic)
def update_app(
    app_id: str,
    body: AppUpdate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(APP_ADMIN),
):
    app = _get_app_or_404(db, app_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return _to_public(app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(app_id: str, db: Session = Depends(get_db), _admin: Member = Depends(APP_ADMIN)):
    app = _get_app_or_404(db, app_id)
    db.delete(app)
    db.commit()
