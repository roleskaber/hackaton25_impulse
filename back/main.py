
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
    get_event_details_by_id,
    list_events_between_dates
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
from dependencies import get_current_user
from crud import get_user_by_email, update_user_in_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection: 
       await connection.run_sync(Base.metadata.create_all)
    # Добавляем недостающие колонки если их нет (отдельная транзакция)
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            # Проверяем и добавляем колонку profile_image
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='profile_image'
            """))
            if result.scalar() is None:
                await conn.execute(text("ALTER TABLE users ADD COLUMN profile_image TEXT"))
    except Exception as e:
        print(f"Warning: Could not add columns (they might already exist): {e}")
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
    firebase_data = await register_user(email=request.email, password=request.password)
    try:
        from crud import create_user_in_db
        await create_user_in_db(email=request.email)
    except Exception:
        pass
    return firebase_data


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
async def events_between_dates(payload: EventsBetweenRequest, limit: int = 100):
    return await list_events_between_dates(start=payload.start, end=payload.end, limit=limit)


@app.post("/order")
async def create_order(order: OrderCreate):
    return await create_order(
        event_id=order.event_id,
        qrcode=order.qrcode,
        payment_method=order.payment_method,
        people_count=order.people_count,
    )


@app.get("/users", dependencies=[Depends(require_api_key)])
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


@app.get("/users/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "phone": current_user.phone,
        "profile_image": current_user.profile_image,
        "role": current_user.role,
        "created_at": current_user.created_at,
    }


@app.patch("/users/me")
async def update_current_user_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    updated = await update_user_in_db(
        user_id=current_user.id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
        profile_image=payload.profile_image,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {
        "id": updated.id,
        "email": updated.email,
        "display_name": updated.display_name,
        "phone": updated.phone,
        "profile_image": updated.profile_image,
        "role": updated.role,
        "created_at": updated.created_at,
    }


@app.patch("/users/{user_id}", dependencies=[Depends(require_api_key)])
async def update_user_by_id(user_id: int, payload: UserUpdate):
    updated = await update_user(
        user_id=user_id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
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

