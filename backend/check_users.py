import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.models import AsyncSessionLocal, User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print("\n--- [ DATABASE USER AUDIT ] ---")
        if not users:
            print("❌ No users found in database.")
        for u in users:
            print(f"👤 Email: {u.email} | Active: {u.is_active} | Role: {u.role}")
        print("-------------------------------\n")

if __name__ == "__main__":
    asyncio.run(check())
