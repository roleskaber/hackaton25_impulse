import os
import smtplib
import asyncio
from email.message import EmailMessage
from urllib.parse import quote_plus
from datetime import datetime, timezone
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
from exceptions import NoUrlFoundException, SlugAlreadyExists

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
    event_type: str | None = None,
    message_link: str | None = None,
) -> dict[str, str | int] | None:
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
    return None


async def get_event_by_slug(
    slug: str
):
    url = await get_url_from_db(slug)
    if not url:
        raise NoUrlFoundException
    return url


def _generate_qr_link(data: str, size: str = "300x300") -> str:
    """Generate a QR code image link using an external service."""
    encoded = quote_plus(data)
    return f"https://api.qrserver.com/v1/create-qr-code/?size={size}&data={encoded}"


async def _send_email(to_email: str, subject: str, body: str):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", user or "")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not host or not to_email:
        raise RuntimeError("SMTP is not configured")

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    def _sync_send():
        with smtplib.SMTP(host, port, timeout=10) as server:
            if use_tls:
                server.starttls()
            if user and password:
                server.login(user, password)
            server.send_message(msg)

    await asyncio.to_thread(_sync_send)


async def create_order(
    event_id: int,
    payment_method: str,
    people_count: int,
    email: str,
):
    event = await get_event_by_id(event_id)
    if not event:
        raise NoUrlFoundException
    qr_link = _generate_qr_link(event.long_url)
    order_id = await create_order_in_db(
        event_id=event_id,
        qrcode=qr_link,
        payment_method=payment_method,
        people_count=people_count,
    )
    await _send_email(
        to_email=email,
        subject=f"Ваш билет на «{event.name}»",
        body=(
            f"Спасибо за заказ #{order_id}!\n"
            f"Событие: {event.name}\n"
            f"Место: {event.place}, {event.city}\n"
            f"Дата и время: {event.event_time}\n"
            f"Ссылка на событие: {event.long_url}\n"
            f"QR-код для входа: {qr_link}"
        ),
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
    if not start:
        start = start or datetime.min.replace(tzinfo=timezone.utc)


    if not end:
        end = end or datetime.max.replace(tzinfo=timezone.utc)

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


async def get_event_details_by_id(event_id: int) -> dict:
    event = await get_event_from_db(event_id)
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

def get_preview():
    return {"data": [
        "https://i.ytimg.com/vi/GWqJGYUjxHI/maxresdefault.jpg", 
        "https://avatars.mds.yandex.net/i?id=b4f5eb3dafda39bd684819099b5fd7fecbcbb1f3-3193964-images-thumbs&n=13", 
        "https://avatars.mds.yandex.net/i?id=17c28b6c89e8be4d0475f6800a8ce684aa5150fd-12913927-images-thumbs&n=13",
        "https://avatars.mds.yandex.net/i?id=0252afbaa9600e67c84bedb810d28e8ef2a118b5-12569903-images-thumbs&n=13", 
        "https://avatars.mds.yandex.net/i?id=b0daf01dede916519a43fc7e58556cf85ec9386d-4713335-images-thumbs&n=13"
    ]}