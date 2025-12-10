from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

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
    payment_method: str = Field(..., description="Способ оплаты")
    people_count: int = Field(..., gt=0, description="Количество человек")
    email: str = Field(..., description="Email пользователя для отправки билета")


class OrderUpdate(BaseModel):
    qrcode: str | None = Field(None, description="QR-код заказа (опционально)")
    payment_method: str | None = Field(None, description="Способ оплаты")
    people_count: int | None = Field(None, ge=0, description="Количество человек")


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, description="Имя пользователя")
    phone: str | None = Field(None, description="Телефон пользователя")
    role: Literal["admin", "user"] | None = Field(None, description="Роль пользователя")


class RegisterRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя")
    password: str = Field(..., min_length=6, description="Пароль")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя")
    password: str = Field(..., description="Пароль")


class VerifyEmailRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя")
    password: str = Field(..., description="Пароль для подтверждения почты")


class PasswordResetRequest(BaseModel):
    email: str = Field(..., description="Почта пользователя для сброса пароля")


class PasswordResetConfirm(BaseModel):
    oob_code: str = Field(..., description="Код из письма Firebase (oobCode)")
    new_password: str = Field(..., min_length=6, description="Новый пароль")


class EventsBetweenRequest(BaseModel):
    start: datetime | None = Field(None, description="Начальная дата (ISO)")
    end: datetime | None = Field(None, description="Конечная дата (ISO)")
