import requests
from test_data import events_data
import os
API_URL = "http://localhost:8001"

def add_event(event_data):
    url = f"{API_URL}/add_event"
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=event_data, headers=headers, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"Событие '{event_data['name']}' успешно добавлено. Slug: {result.get('slug')}, ID: {result.get('event_id')}")
            return True
        else:
            print(f"Ошибка при добавлении '{event_data['name']}': {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Исключение при добавлении '{event_data['name']}': {str(e)}")
        return False

def start_test_data_migration():
    print("ачинаю добавление событий в базу данных...\n")
    
    for event in events_data:
        try:
            add_event(event)
        except Exception as e:
            print(e)


if os.getenv("FAST_API") == "development" and __name__ == "__main__":
    start_test_data_migration()
    
