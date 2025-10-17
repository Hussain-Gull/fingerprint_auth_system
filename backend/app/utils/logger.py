from loguru import logger
from app.core.config import settings

logger.remove()
logger.add(
    "logs/app.log",
    rotation="10 MB",
    level=settings.LOG_LEVEL,
    enqueue=True,
    backtrace=True,
    diagnose=True,
)
logger.add(lambda msg: print(msg, end=""), level=settings.LOG_LEVEL)
