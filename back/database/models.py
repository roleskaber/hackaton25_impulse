from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class ShortURL(Base):
    __tablename__ = "short_urls"

    slug: Mapped[str] = mapped_column(String(32), primary_key=True, index=True, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    place: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    purchased_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    seats_total: Mapped[int] = mapped_column(Integer, nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, nullable=False)