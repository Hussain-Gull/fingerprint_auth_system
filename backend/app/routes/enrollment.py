from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import schemas, crud
from ..fingerprint_service import capture_fingerprint_with_retry
from ..utils.response import APIResponse, APIError
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
    """Enroll a new student with fingerprint."""
    try:
        ok, template = capture_fingerprint_with_retry()
        if not ok or not template:
            # fallback: issue OTP/PIN path - simplified here
            raise APIError.service_unavailable(
                message="Fingerprint device unavailable, try OTP fallback",
                details={"device_status": "unavailable", "fallback_method": "otp"}
            )
        
        s = crud.create_student(db, student, template)
        log.info("Enrollment success for CNIC %s id %s", s.cnic_number, s.id)
        
        return APIResponse.created(
            data=s,
            message="Student enrolled successfully",
            meta={"student_id": s.id, "cnic_number": s.cnic_number}
        )
    except APIError:
        raise
    except Exception as e:
        log.error(f"Enrollment failed for CNIC {student.cnic_number}: {e}")
        raise APIError.internal_server_error(
            message="Enrollment failed",
            details={"cnic_number": student.cnic_number, "error": str(e)}
        )
