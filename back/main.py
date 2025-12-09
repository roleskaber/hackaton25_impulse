from datetime import datetime
from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Literal
from database.db import engine
from database.models import Base
from contextlib import asynccontextmanager
from service import (
    add_event as add_event_service,
    get_event_by_slug as get_event_by_slug_service,
    create_order as create_order_service,
    get_all_users as get_all_users_service,
    update_user as update_user_service,
)
from firebase_auth import login_user, register_user, send_verification_email
from exceptions import NoUrlFoundException
import os
from fastapi import Depends, Header


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


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, description="Имя пользователя")
    phone: str | None = Field(None, description="Телефон пользователя")
    role: Literal["admin", "user"] | None = Field(None, description="Роль пользователя")


def require_api_key(x_api_key: str = Header(..., alias="X-API-KEY")):
    expected = os.getenv("ADMIN_API_KEY")
    if not expected or x_api_key != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return True


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


@app.get("/users", dependencies=[Depends(require_api_key)])
async def get_users():
    return await get_all_users_service()


@app.patch("/users/{user_id}", dependencies=[Depends(require_api_key)])
async def update_user(user_id: int, payload: UserUpdate):
    updated = await update_user_service(
        user_id=user_id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
    )
    return updated

