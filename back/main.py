
from fastapi import FastAPI, HTTPException, status
import openai
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, new_session
from database.models import Base, User, Event
from sqlalchemy import select
from contextlib import asynccontextmanager
from service import (
    add_event,
    create_order,
    update_user,
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
from datatypes import *

load_dotenv('.env')

def require_api_key(x_api_key: str = Header(..., alias="X-API-KEY")):
    expected = os.getenv("ADMIN_API_KEY")
    if not expected or x_api_key != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return True


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


@app.patch("/users/{user_id}", dependencies=[Depends(require_api_key)])
async def update_user(user_id: int, payload: UserUpdate):
    updated = await update_user(
        user_id=user_id,
        display_name=payload.display_name,
        phone=payload.phone,
        role=payload.role,
    )
    return updated

@app.get("/expect")
async def expect_ai(city: str):
    async with new_session() as sess:
        q = select(Event).where(Event.city == city).order_by(Event.event_time.desc()).limit(5)
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

