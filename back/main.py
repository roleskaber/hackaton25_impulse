from datetime import datetime
from fastapi import FastAPI, HTTPException, status, Depends, Header, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from database.db import engine, new_session
from database.models import Base, User, ShortURL
from sqlalchemy import select
from contextlib import asynccontextmanager
from service import (
    add_event as add_event_service,
    get_event_by_slug as get_event_by_slug_service,
    create_order as create_order_service,
    get_all_users as get_all_users_service,
    get_all_orders as get_all_orders_service,
    update_user as update_user_service,
    get_event_details_by_slug,
    list_events_between_dates
)
from firebase_auth import (
    login_user,
    register_user,
    send_verification_email,
    send_password_reset_email,
    confirm_password_reset,
)
from exceptions import NoUrlFoundException
import os
from fastapi import Depends, Header
from dotenv import load_dotenv
import json
import logging

load_dotenv('.env')

class EventCreate(BaseModel):
    long_url: str = Field(..., description="Полная ссылка на событие")
    name: str = Field(..., description="Название события")
    place: str = Field(..., description="Место проведения")
    city: str = Field(..., description="Город проведения")
    event_time: datetime = Field(..., description="Дата и время события")
    price: float = Field(..., description="Цена билета")
    description: str = Field(..., description="Описание события")
    event_type: str | None = Field(None, description="Тип события")
    message_link: str | None = Field(None, description="Ссылка на сообщение")
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


class PasswordResetRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя для сброса пароля")


class PasswordResetConfirm(BaseModel):
    oob_code: str = Field(..., description="Код из письма Firebase (oobCode)")
    new_password: str = Field(..., min_length=6, description="Новый пароль")


class EventsBetweenRequest(BaseModel):
    start: datetime = Field(..., description="Начальная дата (ISO)")
    end: datetime = Field(..., description="Конечная дата (ISO)")

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
    return await send_verification_email(id_token=request.id_token)


@app.post("/auth/password-reset")
async def password_reset(request: PasswordResetRequest):
    return await send_password_reset_email(email=request.email)


@app.post("/auth/password-reset/confirm")
async def password_reset_confirm(request: PasswordResetConfirm):
    return await confirm_password_reset(oob_code=request.oob_code, new_password=request.new_password)


@app.post("/events/between")
async def events_between_dates(payload: EventsBetweenRequest):
    return await list_events_between_dates(start=payload.start, end=payload.end, limit=100)





@app.post("/order")
async def create_order(order: OrderCreate):
    return await create_order_service(
        event_id=order.event_id,
        qrcode=order.qrcode,
        payment_method=order.payment_method,
        people_count=order.people_count,
    )


@app.get("/users", dependencies=[Depends(require_api_key)])
async def get_users(
    role: str | None = Query(None, description="Фильтр по роли (admin/user)"),
    email: str | None = Query(None, description="Поиск по email (частичное совпадение)"),
):
    return await get_all_users_service(role=role, email=email)
async def get_users():
    async with new_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
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
    updated = await update_user_service(
        user_id=user_id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
    )
    return updated


@app.get("/orders", dependencies=[Depends(require_api_key)])
async def get_orders():
    return await get_all_orders_service()
  
@app.get("/expect")
async def expect_ai(city: str):
    async with new_session() as sess:
        q = select(ShortURL).where(ShortURL.city == city).order_by(ShortURL.event_time.desc()).limit(5)
        res = await sess.execute(q)
        events = res.scalars().all()

    if events:
        events_text = "\n".join(
            [
                f"- {e.name} | {e.place} | {e.event_time.isoformat()} | type: {getattr(e, 'event_type', None)} | link: {getattr(e, 'message_link', None)}"
                for e in events
            ]
        )
    else:
        events_text = "Нет известных событий для этого города."

    # Ensure OPENAI API key is present
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in environment")

    client = openai.OpenAI()
    instruction = (
        f"Верни один json события, которое ты считаешь более подходящим по актуальности для текущего сезона в городе {city}. "
        "Возвращай только JSON-объект, без пояснений. Поля: long_url, name, place, city, event_time (ISO), price, description, event_type, message_link, purchased_count, seats_total, account_id."
        f"\n\nСуществующие события (ограничено 5):\n{events_text}"
    )
    try:
        resp = client.responses.create(model="gpt-4o-mini", input=instruction)
        text = None
        try:
            text = resp.output[0].content[0].text
        except Exception:
            try:
                text = resp.output_text
            except Exception:
                text = str(resp)
        try:
            parsed = json.loads(text)
            return parsed
        except Exception:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                snippet = text[start:end+1]
                try:
                    parsed = json.loads(snippet)
                    return parsed
                except Exception:
                    pass
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI request failed")
        raise HTTPException(status_code=500, detail=f"AI request failed: {e}")


@app.get("/{slug}")
async def get_event_by_slug(slug: str):
    try:
        event = await get_event_details_by_slug(slug=slug)
    except NoUrlFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

