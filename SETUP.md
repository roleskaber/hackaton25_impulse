# Инструкция по запуску проекта локально

## Требования

- Docker и Docker Compose
- Python 3.14+ (или используйте uv из pyproject.toml)
- Node.js 18+ и npm
- (Опционально) ngrok для внешнего доступа

## Шаг 1: Запуск базы данных PostgreSQL

```bash
# Запустить PostgreSQL в Docker
docker-compose up -d impulse_db

# Проверить, что база данных запущена
docker-compose ps
```

База данных будет доступна на `localhost:5434` с учетными данными:
- User: `postgres`
- Password: `postgres`
- Database: `postgres`

## Шаг 2: Настройка и запуск бэкенда

### Вариант A: Используя uv (рекомендуется)

```bash
cd back

# Установить зависимости через uv
uv sync

# Активировать виртуальное окружение
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows

# Запустить сервер
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Вариант B: Используя pip

```bash
cd back

# Создать виртуальное окружение
python -m venv venv

# Активировать виртуальное окружение
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Запустить сервер
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Бэкенд будет доступен на `http://localhost:8000`

## Шаг 3: Настройка и запуск фронтенда

```bash
cd web

# Установить зависимости
npm install

# Создать .env файл (если его нет)
echo "REACT_APP_BASE_URL=http://localhost:8000" > .env

# Запустить dev-сервер
npm start
```

Фронтенд будет доступен на `http://localhost:3000`

## Шаг 4: (Опционально) Настройка ngrok для внешнего доступа

Если нужен внешний доступ к бэкенду:

```bash
# Установить ngrok (если еще не установлен)
# https://ngrok.com/download

# Запустить туннель к порту 8000
ngrok http 8000

# Скопировать полученный URL (например: https://xxxxx.ngrok-free.dev)
# Обновить .env файл в папке web:
# REACT_APP_BASE_URL=https://xxxxx.ngrok-free.dev
```

## Проверка работы

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Проверьте, что события загружаются
3. Проверьте API документацию: `http://localhost:8000/docs`

## Полезные команды

### Остановка базы данных
```bash
docker-compose down
```

### Просмотр логов базы данных
```bash
docker-compose logs -f impulse_db
```

### Перезапуск бэкенда
Просто остановите процесс (Ctrl+C) и запустите снова командой из Шага 2.

### Очистка базы данных (если нужно)
```bash
docker-compose down -v
docker-compose up -d impulse_db
```

## Решение проблем

### Бэкенд не подключается к базе данных
- Убедитесь, что PostgreSQL запущен: `docker-compose ps`
- Проверьте, что порт 5434 свободен
- Проверьте логи: `docker-compose logs impulse_db`

### Фронтенд не может подключиться к бэкенду
- Убедитесь, что бэкенд запущен на порту 8000
- Проверьте переменную `REACT_APP_BASE_URL` в `web/.env`
- Перезапустите фронтенд после изменения .env

### Ошибки при установке зависимостей Python
- Убедитесь, что используете Python 3.14+
- Попробуйте использовать `uv` вместо `pip`
- Проверьте, что виртуальное окружение активировано





