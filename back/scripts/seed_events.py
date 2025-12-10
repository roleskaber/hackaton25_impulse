import requests
from test_data import events_data
import os
from datetime import datetime, timedelta
API_URL = "http://localhost:8001"

def get_existing_events():
    try:
        start_date = (datetime.now() - timedelta(days=365)).isoformat()
        end_date = (datetime.now() + timedelta(days=365)).isoformat()
        
        url = f"{API_URL}/events/between"
        headers = {"Content-Type": "application/json"}
        payload = {"start": start_date, "end": end_date}
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Ошибка при получении существующих событий: {str(e)}")
        return []

def event_exists(event_data, existing_events):
    event_name = event_data.get('name', '').strip().lower()
    for existing in existing_events:
        existing_name = existing.get('name', '').strip().lower()
        if event_name == existing_name:
            return True
    return False

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
    print("Начинаю добавление событий из test_data.py в базу данных...\n")
    print("Получаю список существующих событий...")
    existing_events = get_existing_events()
    print(f"Найдено существующих событий: {len(existing_events)}\n")
    
    added_count = 0
    skipped_count = 0
    
    for event in events_data:
        try:
            if event_exists(event, existing_events):
                print(f"Событие '{event['name']}' уже существует, пропускаю...")
                skipped_count += 1
            else:
                if add_event(event):
                    added_count += 1
        except Exception as e:
            print(f"Ошибка при обработке события '{event.get('name', 'Unknown')}': {e}")
    
    print(f"\nГотово! Добавлено новых событий: {added_count}, пропущено существующих: {skipped_count}")


if __name__ == "__main__":
    start_test_data_migration()
    
