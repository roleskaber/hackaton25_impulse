"""
Миграция для добавления колонки profile_image в таблицу users
"""
import asyncio
from sqlalchemy import text
from database.db import engine


async def migrate():
    """Добавляет недостающие колонки в таблицу users"""
    async with engine.begin() as conn:
        try:
            # Проверяем существование колонки profile_image
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='profile_image'
            """))
            if result.scalar() is None:
                await conn.execute(text("ALTER TABLE users ADD COLUMN profile_image TEXT"))
                print("✓ Добавлена колонка profile_image")
            else:
                print("✓ Колонка profile_image уже существует")
                
        except Exception as e:
            print(f"Ошибка при миграции: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(migrate())

