from datetime import datetime

from shortener import generate_slug
from crud import (
    add_slug_to_db,
    create_order_in_db,
    get_all_users_from_db,
    get_event_by_id,
    get_url_from_db,
    get_event_from_db,
    update_user_in_db,
    get_events_between_dates,
)
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
)    account_id: int,
    event_type: str | None = None,
    message_link: str | None = None,
) -> dict:
    slug = generate_slug()
    for _ in range(5):
        try:
            event_id = await add_slug_to_db(
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
                event_type=event_type,
                message_link=message_link,
            )
            return {"slug": slug, "event_id": event_id}
        except SlugAlreadyExists:
            continue

async def get_event_by_slug(
    slug: str
):
    url = await get_url_from_db(slug)
    if not url:
        raise NoUrlFoundException
    return url


async def create_order(
    event_id: int,
    qrcode: str,
    payment_method: str,
    people_count: int,
):
    event = await get_event_by_id(event_id)
    if not event:
        raise NoUrlFoundException
    order_id = await create_order_in_db(
        event_id=event_id,
        qrcode=qrcode,
        payment_method=payment_method,
        people_count=people_count,
    )
    return {
        "order_id": order_id,
        "event": {
            "event_id": event.event_id,
            "slug": event.slug,
            "long_url": event.long_url,
            "name": event.name,
            "place": event.place,
            "city": event.city,
            "event_time": event.event_time,
            "price": float(event.price),
            "description": event.description,
            "purchased_count": event.purchased_count,
            "seats_total": event.seats_total,
            "account_id": event.account_id,
        },
        "qrcode": qrcode,
        "payment_method": payment_method,
        "people_count": people_count,
    }


async def list_events_between_dates(start: datetime, end: datetime, limit: int = 100):
    events = await get_events_between_dates(start=start, end=end, limit=limit)
    return [
        {
            "event_id": event.event_id,
            "slug": event.slug,
            "long_url": event.long_url,
            "name": event.name,
            "place": event.place,
            "city": event.city,
            "event_time": event.event_time,
            "price": float(event.price),
            "description": event.description,
            "event_type": getattr(event, "event_type", None),
            "message_link": getattr(event, "message_link", None),
            "purchased_count": event.purchased_count,
            "seats_total": event.seats_total,
            "account_id": event.account_id,
        }
        for event in events
    ]


async def get_all_users():
    return await get_all_users_from_db()


async def get_event_details_by_slug(slug: str) -> dict:
    event = await get_event_from_db(slug)
    if not event:
        raise NoUrlFoundException
    return event


async def update_user(
    user_id: int,
    display_name: str | None = None,
    phone: str | None = None,
    role: str | None = None,
):
    user = await update_user_in_db(
        user_id=user_id,
        display_name=display_name,
        phone=phone,
        role=role,
    )
    if not user:
        raise NoUrlFoundException  # reuse for 404
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "phone": user.phone,
        "role": user.role,
        "created_at": user.created_at,
    }
    