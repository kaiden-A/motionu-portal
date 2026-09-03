# Motion-U ZITADEL Integration Guide

> **Audience:** coding agents and developers building new applications (portal,
> store management, etc.) on top of the Motion-U ZITADEL identity system.
> This document is the single source of truth for how authentication and the
> Google profile-picture pipeline work, what is already centralized, and the
> exact rules for consuming identity data in a new app.
>
> Facts in this document were verified against the live instance and ZITADEL's
> source/docs during implementation — including several behaviours that differ
> from older ZITADEL documentation. Read the "Pitfalls" section before writing
> any Action/execution config.

---

## 1. Instance ground truth

| Item | Value |
|---|---|
| ZITADEL issuer | `https://motionu-central-auth-jtb0lf.us1.zitadel.cloud` |
| Console generation | v2.50+ / v3 preview ("Next-Gen Actions": instance Actions = webhook targets/executions, **not** inline JS) |
| Google IdP | Registered **instance-default** (single config for every system/org) |
| Access tokens | JWT (backend verifies them against the instance JWKS) |
| Login | Google via ZITADEL hosted login; org-scoped by the app's authorize request |
| Child org — members/users | `387974998695872005` |
| Parent org — projects/apps | `387973774412218199` |
| Portal backend (Cloud Run) | `https://motionu-portal-server-6806424008.asia-southeast1.run.app` |

Organization layout:

```
ZITADEL instance
├── Google IdP (instance-default — used by ALL apps/orgs)
├── Org PARENT 387973774412218199     ← projects live here (Motion-U Internal Apps,
│                                         MITSAI Internal Apps, ZITADEL …)
│     └── Project "Motion-U Internal Apps" (portal's OIDC app + roles)
└── Org CHILD  387974998695872005     ← human members live here (club users)
      └── members … (the portal's Member records)
```

Roles are granted on the *project* and surfaced through the
`urn:zitadel:iam:org:project:roles` claim. The portal maps roles → capabilities
in `server/app/dependencies.py` (`ROLE_CAPS`).

---

## 2. Authentication (reference implementation in this repo)

All apps should use **OIDC Authorization Code + PKCE** exactly like the portal.
The portal is the reference implementation:

| Concern | File |
|---|---|
| Discovery, PKCE, authorize URL, token exchange, ID-token verify (nonce, issuer, org), session JWT (HS256, httpOnly cookie) | `client/lib/auth.ts` |
| Server-side session read | `client/lib/session.ts` |
| BFF proxy guard | `client/proxy.ts` |
| Login / callback / logout / me handlers | `client/app/api/auth/{login,callback,logout,me}/route.ts` |
| Backend token validation (JWKS, issuer, aud, org claim, role→cap) | `server/app/dependencies.py` |

Authorize scopes used by the portal (`client/lib/auth.ts` → `buildAuthorizeUrl`):

```
openid profile email
urn:zitadel:iam:org:id:387974998695872005        # pin login to the members org
urn:zitadel:iam:user:resourceowner               # org id claim
urn:zitadel:iam:org:project:roles                # RBAC roles
urn:zitadel:iam:org:project:id:zitadel:aud       # ONLY needed if the app calls ZITADEL's own APIs
```

**Scope rules for new apps**
- Plain login + avatar: `openid profile email` (+ org scope if you org-pin).
- RBAC: add `urn:zitadel:iam:org:project:roles`.
- Add `urn:zitadel:iam:org:project:id:zitadel:aud` **only** when the app will call
  ZITADEL APIs with the user's access token (e.g. the avatar *upload*). Without it,
  calls return `invalid audience`.

Environment variables (client):

| Var | Purpose |
|---|---|
| `ZITADEL_ISSUER` | Issuer URL |
| `ZITADEL_CLIENT_ID` | OIDC app client id |
| `ZITADEL_ALLOWED_ORG_ID` | Org pinned by the authorize request |
| `NEXTAUTH_SECRET` | HS256 key for the app session cookie (≥32 random bytes) |

---

## 3. The avatar pipeline (how Google photos reach every app)

ZITADEL **does not** forward a Google/IdP avatar into the user profile, tokens or
userinfo by itself. The portal therefore acts as the instance-wide *capture +
store* system, once:

```
Google login
   │  (1) ZITADEL runs its IdP intent; instance-level Actions v2 execution
   │      "Response /zitadel.user.v2.UserService/RetrieveIdentityProviderIntent"
   │      fires and POSTs the intent response (payload type JWT)
   ▼
Portal backend  POST /api/v1/zitadel/idp-intent        (server/app/routers/zitadel_webhook_router.py)
   │  (2) verifies the JWT against the instance JWKS, extracts
   │      response.userId  +  response.idpInformation.rawInformation.picture
   ▼
members.avatar_url  (UPDATE members …)                  (server/app/models/member.py)
   │
   ▼
App login callback   syncZitadelAvatar()                (client/lib/avatar-sync.ts)
   │  (3) reads avatar_url from the portal backend
   │  (4) downloads image (≤512 KiB, content-type image/*)
   ▼
POST {issuer}/assets/v1/users/me/avatar                 (multipart field "file",
   │                                                      needs the zitadel:aud scope)
   ▼
User now HAS a ZITADEL avatar  →  avatar_synced_url recorded so it is not
   │                              uploaded again unless the Google picture changes
   ▼
EVERY other app on the instance inherits the photo (userinfo/ID-token
`picture` claim, v2 user API avatarUrl, ZITADEL console).
```

Key files:

| Piece | File |
|---|---|
| Webhook receiver (JWT verify + DB write) | `server/app/routers/zitadel_webhook_router.py` |
| Upload in login callback | `client/lib/avatar-sync.ts` |
| `avatar_url` + `avatar_synced_url` columns | `server/app/models/member.py`, migration `server/alembic/versions/0008_avatar_synced.py` |
| Mark-uploaded endpoint | `PATCH /api/v1/members/me/avatar-sync` in `server/app/routers/members_router.py` |
| Initials-fallback avatar UI | `client/components/avatar.tsx` |

Known limits (by design):

- The webhook only writes when the portal already has a `Member` row for that
  `userId`. A brand-new user is picked up from their **second** Google login.
- Image must be `image/*` and ≤ 512 KiB (ZITADEL avatar limit, verified in source).
- Upload is best-effort inside the login callback and never blocks sign-in.
- The upload uses the *user's own* access token — there is no admin avatar-upload
  endpoint in ZITADEL (open upstream issue), which is why the callback does it.

---

## 4. "Do I need an avatar_url column in my DB?" — no, not for consumers

| Your need | DB column needed? | How |
|---|---|---|
| Show the **signed-in** user's photo (e.g. store dashboard header) | **No** | Read the `picture` claim (below). Fall back to initials. |
| Show **other** users' photos (e.g. staff/employee list in store management) | **No** (optional cache) | Call `GET {issuer}/v2/users/{id}` with a **bot/service token** (org header) → `user.human.profile.avatarUrl`. Cache locally only if you want to cut API calls. |
| Be a *capture* system (like the portal) | Yes | You own the instance webhook and need the URL server-side before/independently of OIDC tokens. |

`avatar_url` in the portal DB is an implementation detail of the capture system —
consumer apps must **not** add a column just to render pictures.

### 4.1 Render the signed-in user's photo

1. In your login callback (or `/me` handler) fetch userinfo:

```
GET {issuer}/oidc/v1/userinfo
Authorization: Bearer <access_token>
```

2. Read claims: `sub`, `name`, `email`, `picture` (plus `email_verified`).
3. Render with initials fallback (pattern from `client/components/avatar.tsx`):

```tsx
function Avatar({ name, picture }: { name: string; picture?: string | null }) {
  if (picture) {
    return (
      <img
        className="avatar-img"
        src={picture}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }}
      />
    )
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#2c3442' }}>
      {initials || 'MU'}
    </span>
  )
}
```

> **Verify `picture` in your environment:** ZITADEL's claims matrix page omits
> `picture`, but the userinfo model (Actions v2 `PreUserinfo` payload) includes it
> once an avatar is set. Confirm with the OIDC playground or `curl` after a user
> has an avatar; if your version omits it, use the v2 user API below instead.

### 4.2 Render other users' photos (e.g. store-management staff list)

No per-user columns needed — resolve from ZITADEL with a service/bot token:

```bash
# one user
curl -s "{issuer}/v2/users/{userId}" \
  -H "Authorization: Bearer <BOT_TOKEN>" \
  -H "x-zitadel-orgid: 387974998695872005" \
  # → ...user.human.profile.avatarUrl  (field is OMITTED when unset!)

# many users
curl -s -X POST "{issuer}/v2/users/search" \
  -H "Authorization: Bearer <BOT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query":{"limit":"200"},"queries":[{"organizationIdQuery":{"organizationId":"387974998695872005"}}]}'
```

Notes:

- `avatarUrl` sits at `user.human.profile.avatarUrl`; like `email.isVerified`,
  ZITADEL **omits the key entirely when the user has no avatar** — handle missing.
- The portal's `GET /api/v1/members` (directory) also returns `avatar_url` per
  member if your app and the portal share the members domain.
- If your app renders large lists often, cache `userId → avatarUrl` in your own
  table/column with a TTL. That is the *only* reason to store it.

---

## 5. Integrating a brand-new app (checklist)

1. **Console:** create (or get a grant on) a project + OIDC **Web** app.
   - Grant type: Authorization Code, PKCE on.
   - Auth token type: **JWT** (if your backend validates tokens with JWKS).
   - Redirect URIs incl. the login callback; post-logout URIs.
   - Roles: define/assign on the project as needed.
2. **Auth flow:** copy `client/lib/auth.ts` + route handlers + `proxy.ts`
   (nextjs blueprint also documented in `client/zitadel.md`).
3. **Backend validation** (mirror `server/app/dependencies.py`):
   - JWKS signature verify + issuer pin + aud check + org claim check.
4. **Avatar:** follow section 4. No schema change needed for consumers.
5. **RBAC:** read `urn:zitadel:iam:org:project:roles` from the verified token;
   mirror the role→capability map pattern from `ROLE_CAPS`.
6. **Deploy env:** set `ZITADEL_ISSUER`, `ZITADEL_CLIENT_ID`,
   `ZITADEL_ALLOWED_ORG_ID`, `NEXTAUTH_SECRET`.

---

## 6. Agent-critical pitfalls (verified behaviours)

| # | Pitfall | Correct behaviour |
|---|---|---|
| 1 | **V1 Actions never fire for instance-default IdP logins** in this version — neither child-org nor parent-org V1 flows executed during real Google logins (verified via user metadata/change-date). | Do not build anything on V1 External-Authentication actions. Use **Actions v2** instance executions, or app-side capture. |
| 2 | This console's target dialog **never shows the signing key** (verified in console source; the API returns it, the UI doesn't). | Use **payload type JWT** for targets: the body is a JWT signed by the instance key; verify it against the instance JWKS. No shared secret. |
| 3 | Access tokens/ID tokens never carry Google's `picture` unless an avatar already exists in ZITADEL. | Capture once via the `RetrieveIdentityProviderIntent` execution (or portal webhook); afterwards it's native. |
| 4 | ZITADEL omits unset fields in v2 API responses (`avatarUrl`, `email.isVerified`, …). | Treat missing keys as "unset"; don't assume schema is fully populated. |
| 5 | Calling ZITADEL APIs with a user token returns `invalid audience` without the reserved scope. | Add `urn:zitadel:iam:org:project:id:zitadel:aud` at authorize time. |
| 6 | Cloud Run migrations are **manual** (Dockerfile never runs alembic). | After deploying server code with a new migration, run `uv run alembic upgrade head` against the prod `DATABASE_URL`. |
| 7 | Login latency/side effects from avatar plumbing. | All avatar work is best-effort with timeouts and swallows errors (see `client/lib/avatar-sync.ts`). |
| 8 | `zitadel-signature` header (JSON mode) vs `X-ZITADEL-Signature` in docs. | HTTP headers are case-insensitive; the receiver reads `zitadel-signature`. Prefer JWT mode anyway. |
| 9 | Bot/service token permission boundaries. | Child-org mgmt (V1 actions/flows search, user metadata) OK; parent-org writes and **all instance-level resources** (v2 targets/executions) → 403. Instance config must be done by an IAM owner in the console. |
| 10 | ZITADEL avatar upload limits. | `POST {issuer}/assets/v1/users/me/avatar`: multipart field `file`, content type `image/*`, max **512 KiB** (1<<19). |

---

## 7. Troubleshooting matrix

| Symptom | Cause | Fix |
|---|---|---|
| No photo anywhere for a user | Never logged in since the avatar pipeline existed; or first login (no Member row yet) | Sign in again (fresh Google round-trip). Second login fills it. |
| Portal DB `avatar_url` stays NULL | Webhook not receiving/failing | Check Cloud Run logs (`idp-intent …`). Confirm the execution condition is the exact method `/zitadel.user.v2.UserService/RetrieveIdentityProviderIntent` and target payload type is JWT. |
| Webhook logs `bad-jwt` | Target payload type JSON (HMAC) but no signing key, or key mismatch | Switch target payload type to **JWT**. JSON mode only works with `ZITADEL_ACTIONS_SIGNING_KEY` set. |
| `No matching permissions found` on `/v2/actions/...` | Bot is org-scoped; targets/executions are instance resources | Use the console as an instance owner (IAM_OWNER). |
| `No Changes` from `SetTriggerActions` (V1 flows API) | The trigger already has exactly those actions | Read state via `GET /management/v1/flows/{type}` → field `triggerActions` (not `triggers/_search`). |
| `invalid audience` on ZITADEL API calls | Missing `urn:zitadel:iam:org:project:id:zitadel:aud` scope | Add scope; log in again (tokens are minted per login). |
| Avatar upload fails | Not `image/*`, or > 512 KiB | Downscale/convert before upload; the portal's `avatar-sync.ts` guards this. |
| `human.profile.avatarUrl` missing from `GET /v2/users/{id}` | User has no avatar set yet | It appears after the first successful avatar upload. |
| `picture` claim missing from ID token | ZITADEL doesn't put profile claims in ID tokens by default | Use the userinfo endpoint; or enable "User Info inside ID Token" on the app. |
| 500 `column avatar_synced_url does not exist` | Prod migration not run | `uv run alembic upgrade head` with the prod `DATABASE_URL`. |

---

## 8. Repository file map

```
client/
  lib/auth.ts                        OIDC code+PKCE core + scopes + session JWT
  lib/session.ts                     getSession() for server components
  lib/backend.ts                     BFF fetch → FastAPI with the user's access token
  lib/avatar-sync.ts                 upload captured picture → ZITADEL avatar store
  lib/types.ts                       MemberMe/MemberPublic (+ avatar_url fields)
  components/avatar.tsx              <img> with initials fallback
  app/api/auth/{login,callback,logout,me}/route.ts
  app/api/me/route.ts                proxies backend /api/v1/members/me
  proxy.ts                           session guard (middleware)
  zitadel.md                         OIDC blueprint (copy-paste auth flow)

server/
  app/dependencies.py                token verify (JWKS/issuer/aud/org) + role→cap map
  app/routers/zitadel_webhook_router.py   POST /api/v1/zitadel/idp-intent (JWT verify)
  app/routers/members_router.py      /api/v1/members/me, PATCH /me/avatar-sync, directory
  app/models/member.py               Member (avatar_url, avatar_synced_url)
  app/config.py                      env settings incl. optional zitadel_actions_signing_key
  alembic/versions/0007_member_avatar.py, 0008_avatar_synced.py
  Dockerfile                         runs uvicorn only — migrations are manual
```

ZITADEL console state (configured once, do not recreate):

- Google IdP — instance default (all systems).
- Target `portal-idp-intent` — endpoint
  `https://motionu-portal-server-6806424008.asia-southeast1.run.app/api/v1/zitadel/idp-intent`,
  type Webhook (`restWebhook`), payload type **JWT**.
- Execution — **Response** on `/zitadel.user.v2.UserService/RetrieveIdentityProviderIntent`
  → target `portal-idp-intent` (instance-wide).
