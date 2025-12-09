import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:8001"

events_data = [
    {
        "long_url": "https://example.com/event1",
        "name": "Концерт рок-группы 'Импульс'",
        "place": "Крокус Сити Холл",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=7)).isoformat(),
        "price": 2500.00,
        "description": "Грандиозный концерт популярной рок-группы 'Импульс' с новой программой. В программе лучшие хиты и новые композиции.",
        "event_type": "Концерт",
        "message_link": "https://t.me/impulse_concert",
        "purchased_count": 0,
        "seats_total": 5000,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event2",
        "name": "Выставка современного искусства",
        "place": "Третьяковская галерея",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=14)).isoformat(),
        "price": 800.00,
        "description": "Уникальная выставка работ современных российских художников. Более 100 произведений искусства.",
        "event_type": "Выставка",
        "message_link": "https://t.me/art_exhibition",
        "purchased_count": 0,
        "seats_total": 200,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event3",
        "name": "Спектакль 'Гамлет'",
        "place": "МХАТ им. Чехова",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=21)).isoformat(),
        "price": 1500.00,
        "description": "Классическая постановка знаменитой трагедии Шекспира в исполнении ведущих актеров театра.",
        "event_type": "Театр",
        "message_link": "https://t.me/mhat_hamlet",
        "purchased_count": 0,
        "seats_total": 800,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event4",
        "name": "Фестиваль еды и вина",
        "place": "Парк Горького",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=10)).isoformat(),
        "price": 2000.00,
        "description": "Гастрономический фестиваль с дегустацией блюд от лучших ресторанов города и винных коллекций.",
        "event_type": "Фестиваль",
        "message_link": "https://t.me/food_festival",
        "purchased_count": 0,
        "seats_total": 300,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event5",
        "name": "Мастер-класс по программированию",
        "place": "IT-Академия",
        "city": "Санкт-Петербург",
        "event_time": (datetime.now() + timedelta(days=5)).isoformat(),
        "price": 3000.00,
        "description": "Интенсивный мастер-класс по современным технологиям разработки. Практические задания и разбор кейсов.",
        "event_type": "Образование",
        "message_link": "https://t.me/it_masterclass",
        "purchased_count": 0,
        "seats_total": 50,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event6",
        "name": "Беговой марафон",
        "place": "Центральный парк",
        "city": "Санкт-Петербург",
        "event_time": (datetime.now() + timedelta(days=30)).isoformat(),
        "price": 1500.00,
        "description": "Ежегодный городской марафон. Дистанции: 5км, 10км, 21км, 42км. Для всех уровней подготовки.",
        "event_type": "Спорт",
        "message_link": "https://t.me/marathon_spb",
        "purchased_count": 0,
        "seats_total": 1000,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event7",
        "name": "Джазовый вечер",
        "place": "Джаз-клуб 'Blue Note'",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=3)).isoformat(),
        "price": 1200.00,
        "description": "Вечер живой джазовой музыки в уютной атмосфере. Выступление известных джазовых музыкантов.",
        "event_type": "Концерт",
        "message_link": "https://t.me/jazz_evening",
        "purchased_count": 0,
        "seats_total": 150,
        "account_id": 1
    },
    {
        "long_url": "https://example.com/event8",
        "name": "Кинофестиваль независимого кино",
        "place": "Кинотеатр 'Октябрь'",
        "city": "Москва",
        "event_time": (datetime.now() + timedelta(days=20)).isoformat(),
        "price": 500.00,
        "description": "Показ лучших независимых фильмов. Встречи с режиссерами и обсуждения после сеансов.",
        "event_type": "Кино",
        "message_link": "https://t.me/indie_film_fest",
        "purchased_count": 0,
        "seats_total": 400,
        "account_id": 1
    }
]

def add_event(event_data):
    url = f"{API_URL}/add_event"
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=event_data, headers=headers, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Событие '{event_data['name']}' успешно добавлено. Slug: {result.get('slug')}, ID: {result.get('event_id')}")
            return True
        else:
            print(f"❌ Ошибка при добавлении '{event_data['name']}': {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Исключение при добавлении '{event_data['name']}': {str(e)}")
        return False

def main():
    print("🚀 Начинаю добавление событий в базу данных...\n")
    
    success_count = 0
    fail_count = 0
    
    for event in events_data:
        if add_event(event):
            success_count += 1
        else:
            fail_count += 1
        print()
    
    print("=" * 60)
    print(f"📊 Итого: успешно добавлено {success_count}, ошибок {fail_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()

