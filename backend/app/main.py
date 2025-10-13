import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from .database import engine
from . import models
from .routes import enrollment, auth, admin, status
from .secugen_binding import SecuGen
from .config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("backend")

models.Base.metadata.create_all(bind=engine)  # For dev; use alembic for prod migrations

app = FastAPI(title="Fingerprint Auth System")

app.include_router(status.router, prefix="/status")
app.include_router(enrollment.router, prefix="/enroll")
app.include_router(auth.router, prefix="/auth")
app.include_router(admin.router, prefix="/admin")

@app.on_event("startup")
def startup_event():
    # try to connect to device at startup and log
    connected = SecuGen.connect()
    log.info("Startup: SecuGen connected=%s", connected)
    # log also whether USB dataset path accessible - from architecture: backend loads encrypted templates from USB when available. :contentReference[oaicite:8]{index=8}
    usb_path = settings.SECUGEN_SDK_PATH  # reuse env var as example; in real system dataset path separate
    log.info("Startup: SECUGEN_SDK_PATH=%s", usb_path)
