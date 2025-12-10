from datetime import datetime, timezone

from database.db import new_session
from database.models import Order, Event, User
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from exceptions import SlugAlreadyExists
from sqlalchemy.exc import IntegrityError as SAIntegrityError



async def add_slug_to_db(
    slug: str,
    long_url: str,
    name: str,
    place: str,
    city: str,
    event_time: datetime,
    price: float,
    description: str,
    purchased_count: int,
    seats_total: int,
    account_id: int,
    event_type: str | None = None,
    message_link: str | None = None,
) -> int:
    async with new_session() as session:
        if event_time is not None and getattr(event_time, "tzinfo", None) is not None:
            event_time = event_time.astimezone(timezone.utc).replace(tzinfo=None)

        new_slug = Event(
            slug=slug,
            long_url=long_url,
            name=name,
            place=place,
            city=city,
            event_time=event_time,
            price=price,
            description=description,
            event_type=event_type,
            message_link=message_link,
            purchased_count=purchased_count,
            seats_total=seats_total,
            account_id=account_id,
        )
        session.add(new_slug)
        try: 
            await session.commit()
            await session.refresh(new_slug)
            return new_slug.event_id
        except IntegrityError:
            raise SlugAlreadyExists

        

async def get_url_from_db(slug: str) -> str | None:
    async with new_session() as session:
        query = select(Event).filter_by(slug=slug)
        result = await session.execute(query)
        res: Event | None = result.scalar_one_or_none()
    if not res:
        return None
    return res.long_url


async def get_event_from_db(event_id: int) -> dict | None:
    async with new_session() as session:
        query = select(Event).filter_by(event_id=event_id)
        result = await session.execute(query)
        res: Event | None = result.scalar_one_or_none()
        if not res:
            return None
        return {
            "event_id": res.event_id,
            "slug": res.slug,
            "long_url": res.long_url,
            "name": res.name,
            "place": res.place,
            "city": res.city,
            "event_time": res.event_time,
            "price": float(res.price),
            "description": res.description,
            "event_type": res.event_type,
            "message_link": res.message_link,
            "purchased_count": res.purchased_count,
            "seats_total": res.seats_total,
            "account_id": res.account_id,
        }


async def get_events_between_dates(
    start: datetime,
    end: datetime,
    limit: int = 100,
) -> list[Event]:
    async with new_session() as session:
        # Normalize incoming datetimes to UTC-naive to match the DB column
        if start is not None and getattr(start, "tzinfo", None) is not None:
            start = start.astimezone(timezone.utc).replace(tzinfo=None)
        if end is not None and getattr(end, "tzinfo", None) is not None:
            end = end.astimezone(timezone.utc).replace(tzinfo=None)

        query = (
            select(Event)
            .where(Event.event_time.between(start, end))
            .order_by(Event.event_time.asc())
            .limit(limit)
        )
        result = await session.execute(query)
        return list(result.scalars().all())


async def get_event_by_id(event_id: int) -> Event | None:
    async with new_session() as session:
        query = select(Event).filter_by(event_id=event_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()


async def create_order_in_db(
    event_id: int,
    qrcode: str,
    payment_method: str,
    people_count: int,
) -> int:
    async with new_session() as session:
        order = Order(
            event_id=event_id,
            qrcode=qrcode,
            payment_method=payment_method,
            people_count=people_count,
        )
        session.add(order)
        await session.commit()
        await session.refresh(order)
        return order.id


async def get_all_users_from_db() -> list[User]:
    async with new_session() as session:
        result = await session.execute(select(User))
        return list(result.scalars().all())


async def create_user_in_db(email: str, display_name: str | None = None, phone: str | None = None, role: str = "user") -> User:
    async with new_session() as session:
        query = select(User).filter_by(email=email)
        res = await session.execute(query)
        existing: User | None = res.scalar_one_or_none()
        if existing:
            return existing

        user = User(email=email, display_name=display_name, phone=phone, role=role)
        session.add(user)
        try:
            await session.commit()
            await session.refresh(user)
            return user
        except SAIntegrityError:
            await session.rollback()
            res = await session.execute(select(User).filter_by(email=email))
            return res.scalar_one()


async def update_user_in_db(
    user_id: int,
    display_name: str | None = None,
    phone: str | None = None,
    role: str | None = None,
) -> User | None:
    async with new_session() as session:
        query = select(User).filter_by(id=user_id)
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            return None
        if display_name is not None:
            user.display_name = display_name
        if phone is not None:
            user.phone = phone
        if role is not None:
            user.role = role
        await session.commit()
        await session.refresh(user)
        return user


async def get_all_orders_from_db() -> list[Order]:
    async with new_session() as session:
        result = await session.execute(select(Order))
        return list(result.scalars().all())


async def update_order_in_db(
    order_id: int,
    qrcode: str | None = None,
    payment_method: str | None = None,
    people_count: int | None = None,
) -> Order | None:
    async with new_session() as session:
        query = select(Order).filter_by(id=order_id)
        result = await session.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            return None
        if qrcode is not None:
            order.qrcode = qrcode
        if payment_method is not None:
            order.payment_method = payment_method
        if people_count is not None:
            order.people_count = people_count
        await session.commit()
        await session.refresh(order)
        return order
    