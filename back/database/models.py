from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Event(Base):
    __tablename__ = "short_urls"

    event_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    long_url: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    place: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=True)
    message_link: Mapped[str] = mapped_column(String(1024), nullable=True)
    purchased_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    seats_total: Mapped[int] = mapped_column(Integer, nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("short_urls.event_id"), nullable=False, index=True)
    qrcode: Mapped[str] = mapped_column(Text, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    people_count: Mapped[int] = mapped_column(Integer, nullable=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    profile_image: Mapped[str] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)