import re

_UNSAFE = re.compile(r"[^a-z0-9]+")


def slugify(text: str, max_len: int = 64) -> str:
    """'Ticket Scanner' -> 'ticket-scanner'. Falls back to a timestamp-ish
    suffix when the input has no usable characters."""
    slug = _UNSAFE.sub("-", text.strip().lower()).strip("-")
    if not slug:
        slug = "item"
    return slug[:max_len].rstrip("-") or "item"
