from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Admin

async def get_admin_by_username(db: AsyncSession, username: str):
    query = select(Admin).where(Admin.username == username)
    result = await db.execute(query)
    return result.scalar_one_or_none()
