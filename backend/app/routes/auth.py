from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import crud, schemas
from ..fingerprint_service import capture_fingerprint_with_retry
from ..secugen_binding import SecuGen
import logging
from jose import jwt
from ..config import settings

router = APIRouter()
log = logging.getLogger("routes.auth")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/fingerprint", response_model=schemas.AuthResult)
def auth_by_fingerprint(db: Session = Depends(get_db)):
    ok, probe = capture_fingerprint_with_retry()
    if not ok:
        # fallback to OTP/PIN
        return {"success": False, "reason": "device_unavailable"}
    # naive linear scan (not scalable for large sets) - for large datasets do optimized search or indexing in production
    students = db.query.__self__.query  # get underlying query object - but easier: use Session to query Student
    from ..models import Student
    all_students = db.query(Student).all()
    for s in all_students:
        matched, score = SecuGen.match_template(probe, s.fingerprint_template)
        if matched:
            token = jwt.encode({"sub": str(s.id)}, settings.SECRET_KEY, algorithm="HS256")
            log.info("Auth success: %s score=%d", s.id, score)
            return {"success": True, "student": {"id": str(s.id), "name": s.name, "cnic_number": s.cnic_number}, "token": token}
    return {"success": False, "reason": "no_match"}
