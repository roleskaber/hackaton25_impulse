import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import new_session
from database.models import Event, Order
from sqlalchemy import delete

async def delete_all_events():
    async with new_session() as session:
        try:
            print("Удаляю все заказы, связанные с событиями...")
            delete_orders = delete(Order)
            result_orders = await session.execute(delete_orders)
            await session.commit()
            print(f"Удалено заказов: {result_orders.rowcount}")
            
            print("Удаляю все события...")
            delete_events = delete(Event)
            result_events = await session.execute(delete_events)
            await session.commit()
            print(f"Удалено событий: {result_events.rowcount}")
            
            print("Все события успешно удалены из базы данных!")
        except Exception as e:
            await session.rollback()
            print(f"Ошибка при удалении событий: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(delete_all_events())

