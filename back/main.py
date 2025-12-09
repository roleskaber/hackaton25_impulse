from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from database.db import engine
from database.models import Base
from contextlib import asynccontextmanager
from service import (
    add_event as add_event_service,
    get_event_by_slug as get_event_by_slug_service,
    create_order as create_order_service,
)
from crud import get_all_events, get_active_events, get_past_events
from firebase_auth import login_user, register_user, send_verification_email
from exceptions import NoUrlFoundException


class EventCreate(BaseModel):
    long_url: str = Field(..., description="Полная ссылка на событие")
    name: str = Field(..., description="Название события")
    place: str = Field(..., description="Место проведения")
    city: str = Field(..., description="Город проведения")
    event_time: datetime = Field(..., description="Дата и время события")
    price: float = Field(..., description="Цена билета")
    description: str = Field(..., description="Описание события")
    purchased_count: int = Field(..., ge=0, description="Количество купивших билет")
    seats_total: int = Field(..., gt=0, description="Количество мест")
    account_id: int = Field(..., description="ID аккаунта организатора")


class OrderCreate(BaseModel):
    event_id: int = Field(..., description="ID события")
    qrcode: str = Field(..., description="QR-код заказа")
    payment_method: str = Field(..., description="Способ оплаты")
    people_count: int = Field(..., gt=0, description="Количество человек")


class RegisterRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя")
    password: str = Field(..., min_length=6, description="Пароль")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя")
    password: str = Field(..., description="Пароль")


class VerifyEmailRequest(BaseModel):
    id_token: str = Field(..., description="idToken из Firebase для подтверждения почты")

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
    slug = await add_event_service(
        long_url=event.long_url,
        name=event.name,
        place=event.place,
        city=event.city,
        event_time=event.event_time,
        price=event.price,
        description=event.description,
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
    return await send_verification_email(id_token=request.id_token)


@app.get("/{slug}")
async def get_event_by_slug(slug: str):
    try:
        long_url = await get_event_by_slug_service(slug=slug)
    except NoUrlFoundException:
        return HTTPException(status.HTTP_404_NOT_FOUND, detail="...")
    return RedirectResponse(url=long_url, status_code=status.HTTP_302_FOUND)


@app.post("/order")
async def create_order(order: OrderCreate):
    return await create_order_service(
        event_id=order.event_id,
        qrcode=order.qrcode,
        payment_method=order.payment_method,
        people_count=order.people_count,
    )


@app.get("/api/events")
async def get_events():
    events = await get_all_events()
    return [
        {
            "event_id": event.event_id,
            "slug": event.slug,
            "name": event.name,
            "place": event.place,
            "city": event.city,
            "event_time": event.event_time.isoformat(),
            "price": float(event.price),
            "description": event.description,
            "purchased_count": event.purchased_count,
            "seats_total": event.seats_total,
            "account_id": event.account_id,
            "long_url": event.long_url,
        }
        for event in events
    ]


@app.get("/api/events/active")
async def get_active_events_endpoint():
    events = await get_active_events()
    return [
        {
            "event_id": event.event_id,
            "slug": event.slug,
            "name": event.name,
            "place": event.place,
            "city": event.city,
            "event_time": event.event_time.isoformat(),
            "price": float(event.price),
            "description": event.description,
            "purchased_count": event.purchased_count,
            "seats_total": event.seats_total,
            "account_id": event.account_id,
            "long_url": event.long_url,
        }
        for event in events
    ]


@app.get("/api/events/past")
async def get_past_events_endpoint():
    events = await get_past_events()
    return [
        {
            "event_id": event.event_id,
            "slug": event.slug,
            "name": event.name,
            "place": event.place,
            "city": event.city,
            "event_time": event.event_time.isoformat(),
            "price": float(event.price),
            "description": event.description,
            "purchased_count": event.purchased_count,
            "seats_total": event.seats_total,
            "account_id": event.account_id,
            "long_url": event.long_url,
        }
        for event in events
    ]

