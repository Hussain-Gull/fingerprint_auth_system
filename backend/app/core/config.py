import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECUGEN_SGFPLIB_DLL_PATH: str
    FERNET_KEY: str = Field(default="default-fernet-key-for-development")
    SCAN_SESSION_TIMEOUT: int = Field(600)
    LOG_LEVEL: str = Field("INFO")
    ACCESS_TOKEN_EXPIRY: int = Field(3400)
    SECRET_KEY: str = Field(default="default-secret-key-for-development")
    ALGORITHM: str = Field(default="HS256")
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Prevents "extra inputs are not permitted" errors
        env_prefix="",   # No prefix needed
    )


settings = Settings()
