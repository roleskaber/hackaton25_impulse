import asyncio
from sqlalchemy import text
from database.db import engine


async def migrate():
  async with engine.begin() as conn:
    result = await conn.execute(
      text(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='users' AND column_name='status'
        """
      )
    )
    if result.scalar() is None:
      await conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'"))
      print("✓ Добавлена колонка status в users (default 'active')")
    else:
      print("✓ Колонка status уже существует")


if __name__ == "__main__":
  asyncio.run(migrate())

