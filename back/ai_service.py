import json
import logging
import os
from database.db import new_session
from database.models import  Event
from sqlalchemy import select
from fastapi import HTTPException
from openai import OpenAI

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

    if len(events) == 1 and not isinstance(events, str):
        return events

    if not os.getenv("OPENAI_API_KEY") and isinstance(events, str):
        return events[0]

    if not os.getenv("OPENAI_API_KEY") or isinstance(events, str):
        return HTTPException(status_code=400, detail="OpenAI API key is required")

    client = OpenAI()
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
