
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from ai_service import expect_ai
from database.db import engine, new_session
from database.models import Base, User, Event
from sqlalchemy import select
from contextlib import asynccontextmanager
from service import (
    add_event,
    create_order,
    update_user,
    update_order,
    update_event,
    get_event_details_by_id,
    list_events_between_dates,
    get_all_orders,
    get_all_users,
)
from auth_services import (
    login_user,
    register_user,
    send_verification_email,
    send_password_reset_email,
    confirm_password_reset,
    require_api_key
)
from exceptions import NoUrlFoundException
from fastapi import Depends
from datatypes import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection: 
       await connection.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/add_event")
async def create_event(event: EventCreate):
    slug = await add_event(
        long_url=event.long_url,
        name=event.name,
        place=event.place,
        city=event.city,
        event_time=event.event_time,
        event_end_time=event.event_end_time,
        status=event.status,
        price=event.price,
        description=event.description,
        event_type=event.event_type,
        message_link=event.message_link,
        purchased_count=event.purchased_count,
        seats_total=event.seats_total,
        account_id=event.account_id,
    )
    return slug


@app.post("/auth/register")
async def register(request: RegisterRequest):
    return await register_user(email=request.email, password=request.password)


@app.post("/auth/login")
async def login(request: LoginRequest):
    return await login_user(email=request.email, password=request.password)


@app.post("/auth/verify-email")
async def verify_email(request: VerifyEmailRequest):
    return await send_verification_email(email=request.email, password=request.password)


@app.post("/auth/password-reset")
async def password_reset(request: PasswordResetRequest):
    return await send_password_reset_email(email=request.email)


@app.post("/auth/password-reset/confirm")
async def password_reset_confirm(request: PasswordResetConfirm):
    return await confirm_password_reset(oob_code=request.oob_code, new_password=request.new_password)


@app.post("/events/between")
async def events_between_dates(payload: EventsBetweenRequest, limit: int = 100):
    return await list_events_between_dates(start=payload.start, end=payload.end, limit=limit)


@app.post("/order")
async def create_order(order: OrderCreate):
    return await create_order(
        event_id=order.event_id,
        payment_method=order.payment_method,
        people_count=order.people_count,
        email=order.email,
    )


@app.get("/users", dependencies=[Depends(require_api_key)])
async def get_users():
    users = await get_all_users()
    return [
        {
            "id": u.id,
            "email": u.email,
            "display_name": u.display_name,
            "phone": u.phone,
            "role": u.role,
            "created_at": u.created_at,
        }
        for u in users
    ]


@app.patch("/users/{user_id}", dependencies=[Depends(require_api_key)])
async def update_user(user_id: int, payload: UserUpdate):
    updated = await update_user(
        user_id=user_id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
    )
    return updated


@app.patch("/events/{event_id}", dependencies=[Depends(require_api_key)])
async def patch_event(event_id: int, payload: EventUpdate):
    updated = await update_event(
        event_id=event_id,
        long_url=payload.long_url,
        name=payload.name,
        place=payload.place,
        city=payload.city,
        event_time=payload.event_time,
        event_end_time=payload.event_end_time,
        status=payload.status,
        price=payload.price,
        description=payload.description,
        event_type=payload.event_type,
        message_link=payload.message_link,
        purchased_count=payload.purchased_count,
        seats_total=payload.seats_total,
        account_id=payload.account_id,
    )
    return updated


@app.get("/orders", dependencies=[Depends(require_api_key)])
async def get_orders():
    orders = await get_all_orders()
    return [
        {
            "id": o.id,
            "event_id": o.event_id,
            "qrcode": o.qrcode,
            "payment_method": o.payment_method,
            "people_count": o.people_count,
        }
        for o in orders
    ]


@app.patch("/orders/{order_id}", dependencies=[Depends(require_api_key)])
async def patch_order(order_id: int, payload: OrderUpdate):
    updated = await update_order(
        order_id=order_id,
        qrcode=payload.qrcode,
        payment_method=payload.payment_method,
        people_count=payload.people_count,
    )
    return updated


@app.get("/expect")
async def expect(city: str):
    return await expect_ai(city)

@app.get("/events/get/{event_id}")
async def get_event_by_slug(event_id: int):
    try:
        event = await get_event_details_by_id(event_id=event_id)
    except NoUrlFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

