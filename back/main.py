from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from database.db import engine
from database.models import Base
from contextlib import asynccontextmanager
from service import add_event as add_event_service, get_event_by_slug as get_event_by_slug_service
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
    return {"slug": slug}


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

