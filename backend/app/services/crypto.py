from cryptography.fernet import Fernet
from app.core.config import settings
import base64

# Generate a proper Fernet key if the provided one is invalid
def get_fernet_instance():
    try:
        return Fernet(settings.FERNET_KEY.encode())
    except (ValueError, TypeError):
        # If the key is invalid, generate a new one
        # This is for development purposes only
        new_key = Fernet.generate_key()
        return Fernet(new_key)

fernet = get_fernet_instance()

def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)

def decrypt_bytes(token: bytes) -> bytes:
    return fernet.decrypt(token)
