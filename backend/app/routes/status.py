from fastapi import APIRouter
from ..secugen_binding import SecuGen
from ..config import settings
from ..utils.response import APIResponse
import os

router = APIRouter()

@router.get("/")
def get_status():
    """Get system status including device connections and USB dataset presence."""
    try:
        device_status = {
            "secugen_connected": SecuGen.is_connected()
        }
        
        # Check USB dataset presence (for offline dataset)
        # In your architecture, dataset is on encrypted USB/SSD; we simply check mount path
        usb_dataset_path = os.environ.get("USB_DATASET_MOUNT", "")  # set this to mounted path
        usb_present = bool(usb_dataset_path and os.path.exists(usb_dataset_path))
        device_status["usb_dataset_present"] = usb_present
        
        return APIResponse.success(
            data=device_status,
            message="System status retrieved successfully",
            meta={
                "secugen_connected": device_status["secugen_connected"],
                "usb_dataset_present": device_status["usb_dataset_present"]
            }
        )
    except Exception as e:
        return APIResponse.error(
            message="Failed to get system status",
            status_code=500,
            error_code="STATUS_CHECK_FAILED",
            details={"error": str(e)}
        )
