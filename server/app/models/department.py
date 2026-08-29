from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    key: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    short: Mapped[str] = mapped_column(String(32))
    lead: Mapped[str | None] = mapped_column(String(255), nullable=True)
