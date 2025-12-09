from datetime import datetime

from shortener import generate_slug
from crud import add_slug_to_db, get_url_from_db
from crud import get_event_from_db
from exceptions import NoUrlFoundException, ShortenerBaseException, SlugAlreadyExists


async def add_event(
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
) -> str:
    slug = generate_slug()
    for _ in range(5):
        try:
            await add_slug_to_db(
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
            return slug
        except SlugAlreadyExists:
            continue

async def get_event_by_slug(
    slug: str
):
    url = await get_url_from_db(slug)
    if not url:
        raise NoUrlFoundException
    return url


async def get_event_details_by_slug(slug: str) -> dict:
    """Return full event details as a dict or raise NoUrlFoundException."""
    event = await get_event_from_db(slug)
    if not event:
        raise NoUrlFoundException
    return event
    