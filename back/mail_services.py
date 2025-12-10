import os
import smtplib
import asyncio
from email.message import EmailMessage
from typing import Iterable, Sequence


def _smtp_config():
    host = os.getenv("SMTP_HOST")
    if not host:
        raise RuntimeError("SMTP_HOST is not configured")
    return {
        "host": host,
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER"),
        "password": os.getenv("SMTP_PASSWORD"),
        "from_email": os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "")),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() == "true",
    }


def _render_body(lines: Sequence[str]) -> str:
   
    header = "Impulse Events\n--------------------"
    footer = "\n--------------------\nСпасибо, что с нами!\nКоманда Impulse"
    return header + "\n" + "\n".join(lines) + footer


async def _send_email(to_email: str, subject: str, lines: Sequence[str]):
    cfg = _smtp_config()
    msg = EmailMessage()
    msg["From"] = cfg["from_email"]
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(_render_body(lines))

    def _sync_send():
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as server:
            if cfg["use_tls"]:
                server.starttls()
            if cfg["user"] and cfg["password"]:
                server.login(cfg["user"], cfg["password"])
            server.send_message(msg)

    await asyncio.to_thread(_sync_send)


def _event_lines(event) -> list[str]:
    return [
        f"Событие: {getattr(event, 'name', '')}",
        f"Город: {getattr(event, 'city', '')}",
        f"Место: {getattr(event, 'place', '')}",
        f"Начало: {getattr(event, 'event_time', '')}",
        f"Окончание: {getattr(event, 'event_end_time', '')}",
        f"Ссылка: {getattr(event, 'long_url', '')}",
        f"Описание: {getattr(event, 'description', '')}",
    ]


def _admin_emails_from_env() -> list[str]:
    emails = []
    for key in ("ORGANIZER_EMAIL", "ADMIN_EMAIL"):
        raw = os.getenv(key, "")
        emails.extend([e.strip() for e in raw.split(",") if e.strip()])
    return list({e.lower(): e for e in emails}.values())


async def send_registration_email(email: str, code: str):
    await _send_email(
        to_email=email,
        subject="Подтверждение регистрации",
        lines=[
            "Добро пожаловать!",
            "Введите код для подтверждения почты:",
            code,
        ],
    )


async def send_password_reset_notice(email: str):
    await _send_email(
        to_email=email,
        subject="Запрос на восстановление доступа",
        lines=[
            "Вы запросили восстановление доступа.",
            "Следуйте инструкциям из письма от сервиса авторизации.",
        ],
    )


async def send_ticket_email(email: str, event, order_id: int, qr_link: str):
    await _send_email(
        to_email=email,
        subject=f"Ваш билет #{order_id}",
        lines=[
            "Спасибо за участие!",
            * _event_lines(event),
            f"QR-код: {qr_link}",
        ],
    )


async def notify_organizer_confirm(event, organizer_email: str, participant_email: str):
    await _send_email(
        to_email=organizer_email,
        subject=f"Подтверждено участие в событии «{event.name}»",
        lines=[
            f"Участник: {participant_email}",
            * _event_lines(event),
        ],
    )


async def notify_organizer_cancel(event, organizer_email: str, participant_email: str):
    await _send_email(
        to_email=organizer_email,
        subject=f"Отмена участия в событии «{event.name}»",
        lines=[
            f"Участник: {participant_email}",
            * _event_lines(event),
        ],
    )


async def notify_event_updated(event, participants: Iterable[str]):
    lines = [
        "Данные события были обновлены.",
        * _event_lines(event),
    ]
    tasks = [
        _send_email(
            to_email=email,
            subject=f"Обновление события «{event.name}»",
            lines=lines,
        )
        for email in set(participants)
    ]
    for task in tasks:
        await task


async def notify_event_created(event, recipients: Iterable[str]):
    lines = [
        "Создано новое событие.",
        * _event_lines(event),
    ]
    tasks = [
        _send_email(
            to_email=email,
            subject=f"Новое событие «{event.name}»",
            lines=lines,
        )
        for email in set(recipients)
    ]
    for task in tasks:
        await task


async def notify_event_before_start(event, recipients: Iterable[str]):
    lines = [
        "Напоминание: событие стартует менее чем через 24 часа.",
        * _event_lines(event),
    ]
    tasks = [
        _send_email(
            to_email=email,
            subject=f"Напоминание о событии «{event.name}»",
            lines=lines,
        )
        for email in set(recipients)
    ]
    for task in tasks:
        await task


def admin_emails() -> list[str]:
    return _admin_emails_from_env()

