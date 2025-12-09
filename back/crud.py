from datetime import datetime

from database.db import new_session
from database.models import Order, ShortURL
from sqlalchemy import select
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
    if not res:
        return None
    return res.long_url


async def get_event_from_db(slug: str) -> dict | None:
    """Return all stored fields for the event identified by `slug` as a dict.

    This extracts values while the session is open so callers can safely
    return or serialize the result.
    """
    async with new_session() as session:
        query = select(ShortURL).filter_by(slug=slug)
        result = await session.execute(query)
        res: ShortURL | None = result.scalar_one_or_none()
        if not res:
            return None
        return {
            "slug": res.slug,
            "long_url": res.long_url,
            "name": res.name,
            "place": res.place,
            "city": res.city,
            "event_time": res.event_time,
            "price": float(res.price),
            "description": res.description,
            "purchased_count": res.purchased_count,
            "seats_total": res.seats_total,
            "account_id": res.account_id,
        }


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
    