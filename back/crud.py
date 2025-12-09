from datetime import datetime

from database.db import new_session
from database.models import Order, ShortURL, User
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from exceptions import SlugAlreadyExists


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
) -> int:
    async with new_session() as session:
        new_slug = ShortURL(
            slug=slug,
            long_url=long_url,
            name=name,
            place=place,
            city=city,
            event_time=event_time,
            price=price,
            description=description,
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
        query = select(ShortURL).filter_by(slug=slug)
        result = await session.execute(query)
        res: ShortURL | None = result.scalar_one_or_none()
    return res.long_url if res.long_url else None


async def get_events_between_dates(
    start: datetime,
    end: datetime,
    limit: int = 100,
) -> list[ShortURL]:
    async with new_session() as session:
        query = (
            select(ShortURL)
            .where(ShortURL.event_time.between(start, end))
            .order_by(ShortURL.event_time.asc())
            .limit(limit)
        )
        result = await session.execute(query)
        return list(result.scalars().all())


async def get_event_by_id(event_id: int) -> ShortURL | None:
    async with new_session() as session:
        query = select(ShortURL).filter_by(event_id=event_id)
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


async def get_all_users_from_db_filtered(
    role: str | None = None,
    email: str | None = None,
) -> list[User]:
    async with new_session() as session:
        query = select(User)
        if role:
            query = query.filter_by(role=role)
        if email:
            query = query.filter(User.email.ilike(f"%{email}%"))
        result = await session.execute(query)
        return list(result.scalars().all())
    