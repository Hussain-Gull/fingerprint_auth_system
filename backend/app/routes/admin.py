from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import SessionLocal
from .. import crud
from ..utils.response import APIResponse, APIError
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
    """Get all enrolled students."""
    try:
        students = crud.list_students(db)
        return APIResponse.success(
            data=students,
            message=f"Retrieved {len(students)} students",
            meta={"student_count": len(students)}
        )
    except Exception as e:
        log.error(f"Error listing students: {e}")
        raise APIError.internal_server_error(
            message="Failed to retrieve students",
            details={"error": str(e)}
        )

@router.delete("/students/{student_id}")
def safe_delete(student_id: str, confirm: str = None, db: Session = Depends(get_db)):
    """Delete a student with confirmation."""
    # require typed confirmation token: confirm must equal "DELETE-{student_id}"
    if confirm != f"DELETE-{student_id}":
        raise APIError.bad_request(
            message=f"Provide confirm=DELETE-{student_id} to delete",
            details={"required_confirmation": f"DELETE-{student_id}"}
        )
    
    try:
        s = crud.delete_student(db, student_id)
        if not s:
            raise APIError.not_found(
                message="Student not found",
                details={"student_id": student_id}
            )
        
        log.info("Admin deleted student %s", student_id)
        return APIResponse.success(
            data={"deleted_student_id": student_id},
            message="Student deleted successfully",
            meta={"student_id": student_id}
        )
    except APIError:
        raise
    except Exception as e:
        log.error(f"Error deleting student {student_id}: {e}")
        raise APIError.internal_server_error(
            message="Failed to delete student",
            details={"student_id": student_id, "error": str(e)}
        )

@router.post("/export-usb")
def export_to_usb():
    """Trigger USB export process"""
    try:
        # This would trigger the USB writer script
        # For now, return success - in production, this would call the USB writer
        log.info("USB export requested")
        return APIResponse.success(
            data={"export_status": "initiated"},
            message="Export process initiated successfully",
            meta={"export_type": "usb"}
        )
    except Exception as e:
        log.error(f"USB export failed: {e}")
        raise APIError.internal_server_error(
            message="Export failed",
            details={"error": str(e)}
        )