import asyncio
from sqlalchemy.future import select
from app.db.db import AsyncSessionLocal, async_engine, metadata
from app.models.models import Admin
from app.core.security import hash_password

async def seed_admin():
    # Create all tables first
    async with async_engine.begin() as conn:
        await conn.run_sync(metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        query = select(Admin).where(Admin.username == "admin")
        result = await session.execute(query)
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin already exists.")
            return

        new_admin = Admin(
            username="admin",
            password=hash_password("admin123"),
        )
        session.add(new_admin)
        await session.commit()
        print("✅ Admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
