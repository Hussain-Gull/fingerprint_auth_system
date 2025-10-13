from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import crud
import logging

router = APIRouter()
log = logging.getLogger("routes.admin")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    return crud.list_students(db)

@router.delete("/students/{student_id}")
def safe_delete(student_id: str, confirm: str = None, db: Session = Depends(get_db)):
    # require typed confirmation token: confirm must equal "DELETE-{student_id}"
    if confirm != f"DELETE-{student_id}":
        raise HTTPException(400, "Provide confirm=DELETE-{student_id} to delete")
    s = crud.delete_student(db, student_id)
    if not s:
        raise HTTPException(404, "Not found")
    log.info("Admin deleted student %s", student_id)
    return {"deleted": student_id}
