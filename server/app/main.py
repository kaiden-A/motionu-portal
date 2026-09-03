from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    achievements_router,
    apps_router,
    cards_router,
    members_router,
    memberships_router,
    news_router,
    users_router,
    zitadel_webhook_router,
)

app = FastAPI(title="Motion-U Portal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(achievements_router.router)
app.include_router(apps_router.router)
app.include_router(cards_router.router)
app.include_router(members_router.router)
app.include_router(memberships_router.router)
app.include_router(news_router.router)
app.include_router(users_router.router)
app.include_router(zitadel_webhook_router.router)


@app.get("/api/v1/healthz")
def health():
    return {"status": "onz"}


def main() -> None:
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
