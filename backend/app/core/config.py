import os
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECUGEN_SGFPLIB_DLL_PATH: str
    FERNET_KEY: str
    SCAN_SESSION_TIMEOUT: int = Field(600, env="SCAN_SESSION_TIMEOUT")
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    HOST: str = Field("0.0.0.0")
    PORT: int = Field(8000)

    class Config:
        env_file = ".env"

settings = Settings()
