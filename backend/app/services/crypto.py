from cryptography.fernet import Fernet
from app.core.config import settings

fernet = Fernet(settings.FERNET_KEY.encode())

def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)

def decrypt_bytes(token: bytes) -> bytes:
    return fernet.decrypt(token)
