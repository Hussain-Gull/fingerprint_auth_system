import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import enrollment, admin, status, websocket, usb
from .secugen_binding import SecuGen
from .config import settings
from .usb_service_client import usb_client
from .utils.response import APIResponse


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("backend")

models.Base.metadata.create_all(bind=engine)  # For dev; use alembic for prod migrations

app = FastAPI(title="Fingerprint Auth System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router, prefix="/status")
app.include_router(enrollment.router, prefix="/enroll")
app.include_router(admin.router, prefix="/admin")
app.include_router(websocket.router, prefix="/ws")
app.include_router(usb.router, prefix="/usb")

@app.on_event("startup")
def startup_event():
    # try to connect to device at startup and log
    connected = SecuGen.connect()
    log.info("Startup: SecuGen connected=%s", connected)
    
    # Check USB service availability
    usb_service_available = usb_client.is_service_available()
    log.info("Startup: USB service available=%s", usb_service_available)
    
    if usb_service_available:
        try:
            usb_devices = usb_client.get_usb_devices()
            log.info("Startup: Found %d USB devices", usb_devices.get("count", 0))
        except Exception as e:
            log.warning("Startup: Failed to get USB devices: %s", e)
    else:
        log.warning("Startup: USB service not available - USB detection will not work")
    
    # log also whether USB dataset path accessible - from architecture: backend loads encrypted templates from USB when available. :contentReference[oaicite:8]{index=8}
    usb_path = settings.SECUGEN_SDK_PATH  # reuse env var as example; in real system dataset path separate
    log.info("Startup: SECUGEN_SDK_PATH=%s", usb_path)
