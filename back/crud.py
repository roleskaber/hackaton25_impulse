from datetime import datetime

from database.db import new_session
from database.models import ShortURL
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
):
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
        except IntegrityError:
            raise SlugAlreadyExists

        

async def get_url_from_db(slug: str) -> str | None:
    async with new_session() as session:
        query = select(ShortURL).filter_by(slug=slug)
        result = await session.execute(query)
        res: ShortURL | None = result.scalar_one_or_none()
    return res.long_url if res.long_url else None

    