# Motion-U Portals

Card-based portal for the Motion-U organization — member credentials, news & events,
internal apps, achievements, and the external **memberships program** — all in one
system.

- **Client:** Next.js 16 (App Router) + React 19 + Tailwind 4 (`client/`)
- **Server:** FastAPI + SQLAlchemy 2 + Alembic + Postgres/Neon (`server/`)
- **Identity:** Zitadel (OIDC Authorization Code + PKCE), single org, roles as grants

```
Browser ──▶ Next.js (BFF) ──▶ FastAPI ──▶ Postgres (Neon)
   │            │                │
   └────────── Zitadel (SSO, roles)
```

The browser never talks to FastAPI directly. Every page goes through a Next.js
**route handler (BFF)** which attaches the user's Zitadel access token and calls
`/api/v1/*`. FastAPI verifies the token against Zitadel's JWKS on every request.

---

## Who logs in and what they see

| Population | How they sign in | What they see |
|---|---|---|
| **Internal members** | Zitadel org user, role grants (e.g. `mainboards`, `techops`, `Inter`) | Profile, News & Events, Members directory, Apps |
| **Membership holders** | Same Zitadel org, `membership` role grant | Profile, News & Events, member-facing Apps, My Membership |
| **Admins** | Internal roles listed under capabilities below | Everything above + admin pages |

> Membership holders are **not** Motion-U members — they are subscribers to the
> memberships program. They are kept out of the member directory and out of
> staff-only apps.

### Roles → capabilities

Roles come from Zitadel and are mirrored into the DB. The mapping lives in
`server/app/dependencies.py`.

| Capability | Roles allowed |
|---|---|
| `manage_users` | `super_admin`, `mainboards` |
| `manage_cards` | `super_admin`, `mainboards`, `Inter` |
| `manage_news` | `super_admin`, `mainboards`, `Inter` |
| `manage_apps` | `super_admin`, `mainboards` |
| `manage_achievements` | `super_admin`, `mainboards`, `Inter` |
| `manage_memberships` | `super_admin`, `mainboards`, `techops` |

Login itself requires the `member` or `membership` role (`ZITADEL_REQUIRED_ROLES`,
see below).

---

## Features

### Credentials / Cards (`/cards`, `/profile`, `/public/card/[id]`)
- Physical NFC cards are registered by admins (`CARD-###` + RFID UID).
- Cards are **assigned** to a person by `zitadel_sub` (admin), or **claimed**
  by the signed-in member.
- `/profile` shows the digital credential; the public card page renders the
  shareable lanyard card with no auth.

### News & Events (`/news`)
- News feed (pinned first) + upcoming events rail.
- Readable by every signed-in user; written by `manage_news` holders.

### Members directory (`/members`)
- Internal members only (membership holders are filtered out).
- Search / department filter, role chips, earned badges.
- **Every internal member can give badges** to another member via the `Give`
  button — add-only, no self-give, enabled badges only. Removing badges from a
  member is admin-only.

### Achievements (`/achievements`, admin-only)
- Badge catalog CRUD (`manage_achievements` only): create, edit, enable/disable, delete.
- Full-set assignment (`PATCH …/members/{sub}`) and precise removal
  (`POST …/members/{sub}/revoke`) — both admin-only.

### Apps catalog (`/apps`)
- Login required. Apps can be marked **staff only** — membership holders only
  see the member-facing ones (the apps are the program's benefit).
- Catalog CRUD by `manage_apps`.

### Users (`/users`, admin-only)
- Zitadel is the source of truth: create users, assign role grants, suspend /
  reactivate. `super_admin` is never assignable here — only in the Zitadel console.

### Memberships (`/memberships` admin · `/membership` holder)
- **Plans:** admin-managed catalog (name, desc, price, duration days, benefits list).
- **Holders:** admins add a holder by name + email — the API creates their
  Zitadel login, grants the `membership` role, and records the membership
  (plan, status, start/end, auto-renew, notes).
- **Statuses:** `pending`, `active`, `expired`, `cancelled`. An `active`
  membership past its end date reads as `expired` automatically (no background job).
- **Cards:** assign/unassign cards to holders right from the management table.
- **Holder view** (`/membership`): status, validity, plan benefits, card.

---

## Getting started

Prerequisites: Node 20+, Python 3.13, `uv`, and the two `.env` files below.

### 1. Environment

`server/.env`:

```
DATABASE_URL=postgresql://…neon.tech/neondb?sslmode=require
ZITADEL_ISSUER=https://<instance>.zitadel.cloud
ZITADEL_JWKS_URI=https://<instance>.zitadel.cloud/oauth/v2/keys
ZITADEL_AUDIENCE=<project-id>
ZITADEL_ALLOWED_ORG_ID=<org-id>
ZITADEL_REQUIRED_ROLES=["member","membership"]
BOT_TOKEN=<zitadel-service-account-token>
CORS_ORIGINS=http://localhost:3000
```

`client/.env`:

```
ZITADEL_ISSUER=https://<instance>.zitadel.cloud
ZITADEL_CLIENT_ID=<web-app-client-id>
ZITADEL_ALLOWED_ORG_ID=<org-id>
NEXTAUTH_SECRET=<32+ random chars>
API_URL=http://localhost:8000
```

> **Zitadel console setup** (done once): Web app with Authorization Code + PKCE,
> redirect URI `http://localhost:3000/api/auth/callback`, role keys on the
> project (`member`, `membership`, `mainboards`, `techops`, `mulcom`, `Inter`,
> `entrep`, `super_admin`). The full OIDC flow is documented in
> `client/zitadel.md`.

### 2. Run

```bash
npm install          # root — just for `concurrently`
npm run migrate      # alembic upgrade head (DB migrations — run LOCALLY only)
npm run seed         # departments, demo cards, sample membership plans, role sync
npm run dev          # FastAPI on :8000 + Next.js on :3000
```

- Client: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

### 3. Test roles

Login with a Zitadel user, then assign role grants in the Zitadel console to see
the capability-gated pages appear in the sidebar.

---

## Database & migrations

Migrations are in `server/alembic/versions/`:

| Migration | Contents |
|---|---|
| `0001` | departments, members, cards |
| `0002` | members.roles, apps |
| `0003` | members.is_active, news, events |
| `0004` | apps simplify, achievements |
| `0005` | membership_plans, memberships, apps.staff_only |

**Rule:** migrations run locally/CI only — never inside the serving container.
`npm run migrate` before deploying.

Generate a new one with:

```bash
cd server && uv run alembic revision --autogenerate -m "what changed"
```

---

## Docker (server)

```dockerfile
# server/Dockerfile — multi-stage: uv builder → python:3.13-slim runtime
```

```bash
docker build -t motionu-portal-server server/
docker run -p 8000:8000 --env-file server/.env motionu-portal-server
```

- The image only starts uvicorn (`app.main:app` on `$PORT`, default 8000).
  Migrations are **not** run in the container.
- Health check: `GET /api/v1/health`.
- Deploy to Cloud Run without docker.io:

```bash
gcloud run deploy motionu-portal-server --source ./server --region asia-southeast1
```

---

## Architecture notes

- **Auth chain:** Zitadel OIDC (client) → app session JWT cookie (`httpOnly`)
  → edge `proxy.ts` guard → BFF route handlers → FastAPI verifies the Zitadel
  access token (issuer + audience + org + role) → provision/sync `Member` row.
- **BFF pattern:** every `client/app/api/*` route is a thin proxy that forwards
  the user's Zitadel token via `backendFetch()` (`client/lib/backend.ts`).
- **RBAC:** single source of truth is `ROLE_CAPS` in `server/app/dependencies.py`.
  Pages re-check caps server-side; the proxy only handles redirects.
- **Membership vs member:** a `members` row exists for every authenticated user
  (including membership holders — needed for cards). A `memberships` row marks
  someone as a program holder; the directory filters them out, the apps endpoint
  hides staff-only apps from them, and badges can't be given by/from them.

## Key endpoints

| Group | Path | Auth |
|---|---|---|
| Members | `/api/v1/members`, `/api/v1/members/me` | any signed-in user |
| Cards | `/api/v1/cards`, `…/assign`, `…/claim`, `/api/v1/cards/{id}` (public) | admin / member / none |
| News | `/api/v1/news`, `/api/v1/events` | read: signed-in · write: `manage_news` |
| Apps | `/api/v1/apps`, `/api/v1/apps/all` | signed-in (staff-filtered) / `manage_apps` |
| Achievements | `/api/v1/achievements` (+ `/all`, `/{key}`, `/members/{sub}`, `/members/{sub}/give`, `/members/{sub}/revoke`) | catalog admin · give any internal member · revoke admin |
| Users | `/api/v1/users` (+ `/{id}`, deactivate/reactivate) | `manage_users` |
| Memberships | `/api/v1/memberships` (+ `/plans`, `/{id}`, `/{id}/assign-card`, `/me`) | read/write: `manage_memberships` · `/me`: holder |
