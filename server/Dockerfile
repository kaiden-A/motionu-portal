# ---------- Builder: install deps (cached layer), then install app ----------
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy
WORKDIR /server

# Dependencies first — layer cached until pyproject.toml / uv.lock change
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

# Source second — small layer, rebuilt on every change
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
RUN uv sync --frozen --no-dev

# ---------- Runtime: thin python image, venv bin on PATH ----------
FROM python:3.13-slim
ENV PATH="/server/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1
WORKDIR /server

COPY --from=builder /server/.venv /server/.venv
COPY --from=builder /server/app /server/app
COPY --from=builder /server/alembic /server/alembic
COPY --from=builder /server/alembic.ini /server/alembic.ini

EXPOSE 8000

# Migrations are run locally (uv run alembic upgrade head) — never here.
CMD ["/bin/sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
