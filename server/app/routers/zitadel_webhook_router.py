"""Zitadel Actions v2 webhook receiver.

The instance-level execution fires a Response webhook after
`UserService/RetrieveIdentityProviderIntent` (i.e. right after a user
finishes an external IdP login, e.g. Google). ZITADEL POSTs the intent
response — which carries the Zitadel user id and Google's `picture`
claim — to POST /api/v1/zitadel/idp-intent.

Two payload modes are supported:

- **JWT** (default in current consoles): the request body is a JWT signed
  with the instance key and verified against `zitadel_jwks_uri`. No shared
  secret required.
- **JSON**: the body is plain JSON with an HMAC signature in the
  `zitadel-signature` header (`t=<ts>,v1=<hex>`), verified with
  `ZITADEL_ACTIONS_SIGNING_KEY` when configured.

The handler stores the Google picture on the matching portal member so
the login callback can upload it to ZITADEL's own avatar store (making
the picture available to every other system on the instance through the
standard OIDC `picture` claim).
"""

import hashlib
import hmac
import json
import logging
from typing import Any

import jwt
from fastapi import APIRouter, Depends, Request
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Member

logger = logging.getLogger("zitadel.webhook")

router = APIRouter(prefix="/api/v1/zitadel", tags=["zitadel"])

_PICTURE_KEYS = ("picture", "avatar", "avatar_url")

_jwks_client = PyJWKClient(settings.zitadel_jwks_uri, cache_keys=True)


def _verify_hmac(header: str | None, raw_body: bytes) -> bool:
    """JSON payload mode: ZITADEL signs the raw body as
    `${timestamp}.${body}` with HMAC-SHA256 and sends `t=<ts>,v1=<hex>` in
    the `zitadel-signature` header."""
    key = settings.zitadel_actions_signing_key
    if not key or not header:
        return False
    parts = dict(p.split("=", 1) for p in header.split(",") if "=" in p)
    timestamp, signature = parts.get("t"), parts.get("v1")
    if not timestamp or not signature:
        return False
    digest = hmac.new(key.encode(), f"{timestamp}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)


def _verify_jwt(raw_body: bytes) -> dict | None:
    """JWT payload mode: verify the webhook body against the instance JWKS."""
    try:
        token = raw_body.decode("utf-8")
    except UnicodeDecodeError:
        return None
    if token.count(".") != 2:
        return None
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as e:
        logger.warning("idp-intent JWT verification failed: %s", e)
        return None


def _find_picture(node: Any, depth: int = 0) -> str | None:
    """Recursively find an avatar URL under a key like `picture`/`avatar`."""
    if node is None or depth > 8:
        return None
    if isinstance(node, dict):
        for key, value in node.items():
            if key in _PICTURE_KEYS and isinstance(value, str) and value.startswith("https://"):
                return value
        for value in node.values():
            found = _find_picture(value, depth + 1)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_picture(item, depth + 1)
            if found:
                return found
    return None


def _extract_user_id(response: dict) -> str | None:
    uid = response.get("userId")
    if isinstance(uid, str) and uid.isdigit():
        return uid
    return None


def _ignore(reason: str) -> dict:
    return {"status": "ignored", "reason": reason}


def _store_picture(response: dict, db: Session) -> dict:
    picture = _find_picture(response)
    user_id = _extract_user_id(response)
    if not picture or not user_id:
        return _ignore("no-picture-or-user")

    member = db.query(Member).filter(Member.zitadel_sub == user_id).first()
    if not member:
        # Unknown user (not a portal member yet) — first-login members get
        # picked up on their next Google login, once provisioned.
        return _ignore("unknown-user")

    if member.avatar_url != picture:
        member.avatar_url = picture
        db.commit()
        logger.info("updated avatar_url for member %s", user_id)
    return {"status": "ok"}


@router.post("/idp-intent")
async def idp_intent(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    try:
        text = raw_body.decode("utf-8")
    except UnicodeDecodeError:
        return _ignore("no-json")

    # JWT payload mode (current consoles) — verify against the instance JWKS.
    if text.count(".") == 2 and not text.lstrip().startswith("{"):
        claims = _verify_jwt(raw_body)
        if claims is None:
            return {"status": "rejected", "reason": "bad-jwt"}
        response = claims.get("response")
        if not isinstance(response, dict):
            return _ignore("no-response")
        logger.info(
            "idp-intent (jwt) received: responseKeys=%s picture=%s userId=%s",
            sorted(response.keys())[:12],
            bool(_find_picture(response)),
            bool(_extract_user_id(response)),
        )
        return _store_picture(response, db)

    # Plain JSON payload mode — HMAC-signed with the shared target key.
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return _ignore("no-json")

    response = payload.get("response")
    if not isinstance(response, dict):
        return _ignore("no-response")

    if not settings.zitadel_actions_signing_key:
        logger.warning("ZITADEL_ACTIONS_SIGNING_KEY not set — ignoring idp-intent")
        return _ignore("no-signing-key")

    if not _verify_hmac(request.headers.get("zitadel-signature"), raw_body):
        logger.warning("idp-intent signature mismatch")
        return {"status": "rejected", "reason": "bad-signature"}

    logger.info(
        "idp-intent (json) received: responseKeys=%s picture=%s userId=%s",
        sorted(response.keys())[:12],
        bool(_find_picture(response)),
        bool(_extract_user_id(response)),
    )
    return _store_picture(response, db)
