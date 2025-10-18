from sqlalchemy import create_engine, MetaData
from databases import Database
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLAlchemy engine for Alembic / synchronous migrations with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    future=True,
    pool_size=5,  # Number of connections to maintain in pool
    max_overflow=10,  # Additional connections beyond pool_size
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Async engine for async sessions
async_engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    future=True,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Session factory
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

# databases Database instance for async queries
database = Database(settings.DATABASE_URL)

Base = declarative_base()

# Dependency for FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

metadata = MetaData()
