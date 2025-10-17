from urllib.parse import urlparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import applications, ws_routes
from backend.app.db.db import database, engine, metadata
from app.utils.logger import logger
from app.core.config import settings

app = FastAPI(title="Fingerprint Auth API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def get_database_info():
    """Extract database information from DATABASE_URL."""
    try:
        parsed_url = urlparse(settings.DATABASE_URL)
        db_name = parsed_url.path.lstrip('/') if parsed_url.path else 'unknown'
        db_host = parsed_url.hostname or 'localhost'
        db_port = parsed_url.port or 'default'
        db_type = parsed_url.scheme or 'unknown'
        
        return {
            'name': db_name,
            'host': db_host,
            'port': db_port,
            'type': db_type,
            'url': settings.DATABASE_URL
        }
    except Exception as e:
        logger.warning("Could not parse DATABASE_URL: %s", e)
        return {
            'name': 'unknown',
            'host': 'unknown',
            'port': 'unknown',
            'type': 'unknown',
            'url': settings.DATABASE_URL
        }

# include routers
app.include_router(applications.router, prefix="/api")
app.include_router(ws_routes.router)

@app.get("/health")
async def health_check():
    """Health check endpoint to verify database connectivity."""
    try:
        await database.fetch_one("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error("Health check failed: {}", str(e))
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.on_event("startup")
async def startup():
    # Get database information
    db_info = get_database_info()
    
    try:
        # create tables if not exist - in production use alembic migrations
        metadata.create_all(engine)
        await database.connect()
        
        # Test database connection
        await database.fetch_one("SELECT 1")
        
        # Log successful database connection with details
        logger.info("Successfully connected to database!")
        logger.info("Database Details:")
        logger.info("  - Type: {}", db_info['type'])
        logger.info("  - Name: {}", db_info['name'])
        logger.info("  - Host: {}", db_info['host'])
        logger.info("  - Port: {}", db_info['port'])
        logger.info("  - URL: {}", db_info['url'])
        
        logger.info("Server starting at {}:{}", settings.HOST, settings.PORT)
        
    except Exception as e:
        logger.error("Failed to connect to database: {}", str(e))
        raise

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    logger.info("Database disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, log_level="info")
