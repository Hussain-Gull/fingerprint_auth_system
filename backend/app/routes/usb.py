"""
USB Routes - Hybrid Docker + Windows USB Detection
================================================
Routes for USB device detection using the Windows-native USB service.
These routes communicate with the USB service running on the Windows host.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
import logging
from ..usb_service_client import usb_client
from ..utils.response import APIResponse, APIError

router = APIRouter()
log = logging.getLogger("routes.usb")

@router.get("/usb")
def get_usb_devices():
    """
    Get list of USB devices from the Windows-native USB service.
    
    This endpoint communicates with the USB service running on the Windows host
    via host.docker.internal:6000 to get real-time USB device information.
    
    Returns:
        JSONResponse containing USB devices list and metadata
    """
    try:
        log.info("Fetching USB devices from Windows USB service...")
        
        # Get USB devices from the Windows service
        response = usb_client.get_usb_devices()
        
        log.info(f"Successfully retrieved {response.get('count', 0)} USB devices")
        return APIResponse.success(
            data=response,
            message=f"Retrieved {response.get('count', 0)} USB devices",
            meta={"device_count": response.get('count', 0)}
        )
        
    except HTTPException as e:
        log.error(f"HTTP error getting USB devices: {e.detail}")
        raise e
    except Exception as e:
        log.error(f"Unexpected error getting USB devices: {e}")
        raise APIError.internal_server_error(
            message="Failed to get USB devices",
            details={"error": str(e)}
        )

@router.get("/usb/health")
def usb_service_health():
    """
    Check the health of the USB service.
    
    Returns:
        JSONResponse containing USB service health status
    """
    try:
        log.info("Checking USB service health...")
        
        health_data = usb_client.health_check()
        
        log.info("USB service is healthy")
        return APIResponse.success(
            data={
                "usb_service_healthy": True,
                "usb_service_data": health_data
            },
            message="USB service is healthy"
        )
        
    except HTTPException as e:
        log.warning(f"USB service health check failed: {e.detail}")
        return APIResponse.error(
            message="USB service health check failed",
            status_code=503,
            error_code="SERVICE_UNAVAILABLE",
            details={"usb_service_healthy": False, "error": e.detail}
        )
    except Exception as e:
        log.error(f"Unexpected error checking USB service health: {e}")
        return APIResponse.error(
            message="USB service health check failed",
            status_code=500,
            error_code="HEALTH_CHECK_FAILED",
            details={"usb_service_healthy": False, "error": str(e)}
        )

@router.get("/usb/{device_id}")
def get_usb_device(device_id: str):
    """
    Get specific USB device by ID.
    
    Args:
        device_id: The device ID (e.g., "E:", "F:")
        
    Returns:
        JSONResponse containing the specific USB device information
    """
    try:
        log.info(f"Fetching USB device {device_id} from Windows USB service...")
        
        response = usb_client.get_usb_device(device_id)
        
        log.info(f"Successfully retrieved USB device {device_id}")
        return APIResponse.success(
            data=response,
            message=f"Retrieved USB device {device_id}"
        )
        
    except HTTPException as e:
        log.error(f"HTTP error getting USB device {device_id}: {e.detail}")
        raise e
    except Exception as e:
        log.error(f"Unexpected error getting USB device {device_id}: {e}")
        raise APIError.internal_server_error(
            message=f"Failed to get USB device {device_id}",
            details={"device_id": device_id, "error": str(e)}
        )

@router.post("/usb/refresh")
def refresh_usb_devices():
    """
    Refresh the USB device list.
    
    This endpoint triggers a refresh of the USB device list in the Windows service.
    
    Returns:
        JSONResponse containing refreshed USB devices list
    """
    try:
        log.info("Refreshing USB devices list...")
        
        response = usb_client.refresh_usb_devices()
        
        log.info(f"Successfully refreshed USB devices list. Found {response.get('count', 0)} devices")
        return APIResponse.success(
            data=response,
            message=f"Refreshed USB devices list. Found {response.get('count', 0)} devices",
            meta={"device_count": response.get('count', 0)}
        )
        
    except HTTPException as e:
        log.error(f"HTTP error refreshing USB devices: {e.detail}")
        raise e
    except Exception as e:
        log.error(f"Unexpected error refreshing USB devices: {e}")
        raise APIError.internal_server_error(
            message="Failed to refresh USB devices",
            details={"error": str(e)}
        )

@router.get("/usb/status")
def usb_service_status():
    """
    Get comprehensive USB service status.
    
    Returns:
        JSONResponse containing USB service availability and device count
    """
    try:
        log.info("Getting comprehensive USB service status...")
        
        # Check if service is available
        is_available = usb_client.is_service_available()
        
        if not is_available:
            return APIResponse.error(
                message="USB service is not available",
                status_code=503,
                error_code="SERVICE_UNAVAILABLE",
                details={
                    "usb_service_available": False,
                    "devices_count": 0,
                    "devices": []
                }
            )
        
        # Get devices if service is available
        devices_response = usb_client.get_usb_devices()
        
        return APIResponse.success(
            data={
                "usb_service_available": True,
                "devices_count": devices_response.get("count", 0),
                "devices": devices_response.get("devices", []),
                "timestamp": devices_response.get("timestamp")
            },
            message="USB service status retrieved successfully",
            meta={"device_count": devices_response.get("count", 0)}
        )
        
    except Exception as e:
        log.error(f"Error getting USB service status: {e}")
        return APIResponse.error(
            message="Failed to get USB service status",
            status_code=500,
            error_code="STATUS_CHECK_FAILED",
            details={
                "usb_service_available": False,
                "error": str(e),
                "devices_count": 0,
                "devices": []
            }
        )
