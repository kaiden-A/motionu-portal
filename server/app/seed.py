"""Seed the database with departments and unassigned demo cards.

Usage: uv run python -m app.seed
"""

from app.database import SessionLocal
from app.models import Card, Department

DEPARTMENTS = [
    {"key": "mainboard", "name": "Mainboards", "short": "Mainboard",
     "lead": "Sets direction, owns the calendar, signs off every event."},
    {"key": "techops", "name": "Technical Operations", "short": "Tech Ops",
     "lead": "Builds and runs the stations, cards, and everything with a plug."},
    {"key": "multimedia", "name": "Multimedia & Communications", "short": "Multimedia",
     "lead": "Shoots, edits, and posts — the department members actually see."},
    {"key": "entrepreneur", "name": "Entrepreneurship", "short": "Entrepreneur.",
     "lead": "Runs sponsorships, merch, and anything that needs a budget."},
    {"key": "internal", "name": "Internal Affairs", "short": "Internal",
     "lead": "Keeps members onboarded, welfare covered, and records straight."},
]

DEMO_CARDS = [
    {"card_id": "CARD-001", "uid": "04:A2:9F:1C:5E:80"},
    {"card_id": "CARD-002", "uid": "04:B1:77:0A:2D:11"},
    {"card_id": "CARD-003", "uid": "04:C4:5B:E2:99:03"},
    {"card_id": "CARD-004", "uid": "04:D0:12:9A:6F:44"},
    {"card_id": "CARD-005", "uid": "04:E8:34:7C:11:2A"},
    {"card_id": "CARD-006", "uid": "04:F3:9D:20:BB:C7"},
    {"card_id": "CARD-007", "uid": "04:1A:60:88:D4:35"},
    {"card_id": "CARD-008", "uid": "04:2E:C7:41:09:9B"},
    {"card_id": "CARD-009", "uid": "04:77:0F:B3:2C:6D"},
    {"card_id": "CARD-010", "uid": "04:9C:E1:55:80:F0"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        for d in DEPARTMENTS:
            if not db.query(Department).filter(Department.key == d["key"]).first():
                db.add(Department(**d))
        for c in DEMO_CARDS:
            if not db.query(Card).filter(Card.card_id == c["card_id"]).first():
                db.add(Card(**c))
        db.commit()
        print(f"Seeded {len(DEPARTMENTS)} departments, {len(DEMO_CARDS)} cards")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
