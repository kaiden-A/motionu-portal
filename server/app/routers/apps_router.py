from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_member
from app.models import App, Member
from app.schemas import AppCreate, AppPublic, AppUpdate

router = APIRouter(prefix="/api/v1/apps", tags=["apps"])


def _to_public(app: App) -> AppPublic:
    return AppPublic(
        app_id=app.app_id,
        name=app.name,
        desc=app.desc,
        category=app.category,
        dept=app.dept,
        icon=app.icon,
        url=app.url,
        enabled=app.enabled,
    )


def _get_app_or_404(db: Session, app_id: str) -> App:
    app = db.query(App).filter(App.app_id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


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
def list_all_apps(db: Session = Depends(get_db), _admin: Member = Depends(get_admin_member)):
    """Admin view — all apps including disabled."""
    apps = db.query(App).order_by(App.sort, App.name).all()
    return [_to_public(a) for a in apps]


@router.post("", response_model=AppPublic, status_code=status.HTTP_201_CREATED)
def create_app(body: AppCreate, db: Session = Depends(get_db), _admin: Member = Depends(get_admin_member)):
    if db.query(App).filter(App.app_id == body.app_id).first():
        raise HTTPException(status_code=409, detail="app_id already exists")
    app = App(**body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return _to_public(app)


@router.patch("/{app_id}", response_model=AppPublic)
def update_app(
    app_id: str,
    body: AppUpdate,
    db: Session = Depends(get_db),
    _admin: Member = Depends(get_admin_member),
):
    app = _get_app_or_404(db, app_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    db.refresh(app)
    return _to_public(app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(app_id: str, db: Session = Depends(get_db), _admin: Member = Depends(get_admin_member)):
    app = _get_app_or_404(db, app_id)
    db.delete(app)
    db.commit()
