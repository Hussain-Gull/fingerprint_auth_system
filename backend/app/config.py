from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@db:5432/fingerprintdb"
    SECRET_KEY: str = "CHANGE_ME_REPLACE_IN_PROD"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SECUGEN_SDK_PATH: str = r"C:\FDx SDK Pro for Windows v4.3.1\bin\x64"
    USB_DATASET_LABEL: str = "student_dataset_v1"
    USB_WRITE_DIRNAME: str = "student_dataset_v1"
    SDK_DEVICE_AUTODETECT: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
