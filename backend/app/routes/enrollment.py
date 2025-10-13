from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import schemas, crud
from ..fingerprint_service import capture_fingerprint_with_retry
import logging

router = APIRouter()
log = logging.getLogger("routes.enrollment")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.StudentDB)
def enroll(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    ok, template = capture_fingerprint_with_retry()
    if not ok or not template:
        # fallback: issue OTP/PIN path - simplified here
        raise HTTPException(503, detail="Fingerprint device unavailable, try OTP fallback.")
    s = crud.create_student(db, student, template)
    log.info("Enrollment success for CNIC %s id %s", s.cnic_number, s.id)
    return s
