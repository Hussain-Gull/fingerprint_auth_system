from sqlalchemy import create_engine, MetaData
from databases import Database
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

# databases Database instance for async queries
database = Database(settings.DATABASE_URL)

metadata = MetaData()
