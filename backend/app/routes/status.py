from fastapi import APIRouter
from ..secugen_binding import SecuGen
from ..config import settings
import os

router = APIRouter()

@router.get("/")
def get_status():
    device = {"secugen_connected": SecuGen.is_connected()}
    # Check USB dataset presence (for offline dataset)
    # In your architecture, dataset is on encrypted USB/SSD; we simply check mount path
    usb_dataset_path = os.environ.get("USB_DATASET_MOUNT", "")  # set this to mounted path
    usb_present = bool(usb_dataset_path and os.path.exists(usb_dataset_path))
    device["usb_dataset_present"] = usb_present
    return device
