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
    get_all_user_emails_from_db,
    get_all_orders_from_db,
    get_event_by_id,
    get_url_from_db,
    get_event_from_db,
    update_user_in_db,
    update_order_in_db,
    soft_delete_user_in_db,
    update_event_in_db,
    get_order_emails_by_event,
    get_events_between_dates,
)
from exceptions import NoUrlFoundException, SlugAlreadyExists
from mail_services import (
    send_ticket_email,
    notify_organizer_confirm,
    notify_organizer_cancel,
    notify_event_updated,
    notify_event_created,
    notify_event_before_start,
    admin_emails,
)

async def add_event(
    long_url: str,
    name: str,
    place: str,
    city: str,
    event_time: datetime,
    event_end_time: datetime | None,
    status: str | None,
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
                event_end_time=event_end_time,
                status=status,
                price=price,
                description=description,
                purchased_count=purchased_count,
                seats_total=seats_total,
                account_id=account_id,
                event_type=event_type,
                message_link=message_link,
            )
            # Notify admins/organizers about creation
            for email in admin_emails():
                await notify_event_created(
                    event=type("E", (), {
                        "name": name,
                        "city": city,
                        "place": place,
                        "event_time": event_time,
                        "event_end_time": event_end_time,
                        "long_url": long_url,
                        "description": description,
                    })(),
                    recipients=[email],
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
   
    encoded = quote_plus(data)
    return f"https://api.qrserver.com/v1/create-qr-code/?size={size}&data={encoded}"


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
        email=email,
    )
    await send_ticket_email(email=email, event=event, order_id=order_id, qr_link=qr_link)
    for org_email in admin_emails():
        await notify_organizer_confirm(event=event, organizer_email=org_email, participant_email=email)
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
        "qrcode": qr_link,
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
            "event_end_time": getattr(event, "event_end_time", None),
            "status": getattr(event, "status", None),
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


async def get_all_orders():
    return await get_all_orders_from_db()


async def send_event_reminder(event_id: int):
    event = await get_event_by_id(event_id)
    if not event:
        raise NoUrlFoundException
    participants = await get_order_emails_by_event(event_id)
    if participants:
        await notify_event_before_start(event=event, recipients=participants)
    return {"success": True, "recipients": list(set(participants))}


async def send_event_created_broadcast(event_id: int):
    event = await get_event_by_id(event_id)
    if not event:
        raise NoUrlFoundException
    recipients = await get_all_user_emails_from_db(status="active")
    if recipients:
        await notify_event_created(event=event, recipients=recipients)
    return {"success": True, "recipients": len(recipients)}


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
    status: str | None = None,
):
    user = await update_user_in_db(
        user_id=user_id,
        display_name=display_name,
        phone=phone,
        role=role,
        status=status,
    )
    if not user:
        raise NoUrlFoundException  # reuse for 404
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at,
    }


async def update_order(
    order_id: int,
    qrcode: str | None = None,
    payment_method: str | None = None,
    people_count: int | None = None,
):
    order = await update_order_in_db(
        order_id=order_id,
        qrcode=qrcode,
        payment_method=payment_method,
        people_count=people_count,
    )
    if not order:
        raise NoUrlFoundException  # reuse for 404
    return {
        "id": order.id,
        "event_id": order.event_id,
        "qrcode": order.qrcode,
        "payment_method": order.payment_method,
        "people_count": order.people_count,
        "email": order.email,
    }


async def delete_user(user_id: int):
    user = await soft_delete_user_in_db(user_id)
    if not user:
        raise NoUrlFoundException
    return {"success": True}


def _compute_status(end_time: datetime | None) -> str:
    if end_time is None:
        return "scheduled"
    now = datetime.utcnow()
    naive_end = end_time.replace(tzinfo=None)
    return "finished" if naive_end < now else "scheduled"


async def update_event(
    event_id: int,
    long_url: str | None = None,
    name: str | None = None,
    place: str | None = None,
    city: str | None = None,
    event_time: datetime | None = None,
    event_end_time: datetime | None = None,
    status: str | None = None,
    price: float | None = None,
    description: str | None = None,
    event_type: str | None = None,
    message_link: str | None = None,
    purchased_count: int | None = None,
    seats_total: int | None = None,
    account_id: int | None = None,
):
    auto_status = _compute_status(event_end_time) if event_end_time is not None else None
    new_status = auto_status or status

    event = await update_event_in_db(
        event_id=event_id,
        long_url=long_url,
        name=name,
        place=place,
        city=city,
        event_time=event_time,
        event_end_time=event_end_time,
        status=new_status,
        price=price,
        description=description,
        event_type=event_type,
        message_link=message_link,
        purchased_count=purchased_count,
        seats_total=seats_total,
        account_id=account_id,
    )
    if not event:
        raise NoUrlFoundException

    participant_emails = await get_order_emails_by_event(event_id)
    if participant_emails:
        await notify_event_updated(event=event, participants=participant_emails)

    return {
        "event_id": event.event_id,
        "slug": event.slug,
        "long_url": event.long_url,
        "name": event.name,
        "place": event.place,
        "city": event.city,
        "event_time": event.event_time,
        "event_end_time": event.event_end_time,
        "status": event.status,
        "price": float(event.price),
        "description": event.description,
        "event_type": event.event_type,
        "message_link": event.message_link,
        "purchased_count": event.purchased_count,
        "seats_total": event.seats_total,
        "account_id": event.account_id,
    }
    
def get_preview():
    return {"data": [
        "https://i.ytimg.com/vi/GWqJGYUjxHI/maxresdefault.jpg", 
        "https://avatars.mds.yandex.net/i?id=b4f5eb3dafda39bd684819099b5fd7fecbcbb1f3-3193964-images-thumbs&n=13", 
        "https://avatars.mds.yandex.net/i?id=17c28b6c89e8be4d0475f6800a8ce684aa5150fd-12913927-images-thumbs&n=13",
        "https://avatars.mds.yandex.net/i?id=0252afbaa9600e67c84bedb810d28e8ef2a118b5-12569903-images-thumbs&n=13", 
        "https://avatars.mds.yandex.net/i?id=b0daf01dede916519a43fc7e58556cf85ec9386d-4713335-images-thumbs&n=13"
    ]}
