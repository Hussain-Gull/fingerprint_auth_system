"""
FastAPI Backend - Hybrid Docker + Windows USB Detection
=====================================================
FastAPI backend running inside Docker container that communicates with
Windows-native USB detection service via HTTP.

This backend:
- Runs in a Linux Docker container
- Communicates with Windows USB service via host.docker.internal:6000
- Exposes /usb endpoint for USB device information
- Uses WebSockets for real-time communication
"""

import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine
from backend import models
from backend.routes import enrollment, admin, status, websocket, usb
from backend.secugen_binding import SecuGen
from backend.config import settings
from backend.usb_service_client import usb_client
from backend.utils.response import APIResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("backend")

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fingerprint Auth System - Hybrid Docker + Windows")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(status.router, prefix="/status")
app.include_router(enrollment.router, prefix="/enroll")
app.include_router(admin.router, prefix="/admin")
app.include_router(websocket.router, prefix="/ws")
app.include_router(usb.router, prefix="/usb")

@app.on_event("startup")
def startup_event():
    """Startup event handler."""
    log.info("=" * 60)
    log.info("Starting Fingerprint Auth System Backend...")
    log.info("=" * 60)
    
    # Try to connect to SecuGen device
    connected = SecuGen.connect()
    log.info("Startup: SecuGen connected=%s", connected)
    
    # Check USB service availability
    usb_service_available = usb_client.is_service_available()
    log.info("Startup: USB service available=%s", usb_service_available)
    
    if usb_service_available:
        try:
            usb_devices_response = usb_client.get_usb_devices()
            device_count = usb_devices_response.get("count", 0)
            devices = usb_devices_response.get("devices", [])
            
            log.info("=" * 60)
            log.info("USB DEVICE DETECTION RESULTS")
            log.info("=" * 60)
            log.info("Total USB devices found: %d", device_count)
            
            if device_count > 0:
                log.info("-" * 60)
                log.info("DETAILED USB DEVICE INFORMATION:")
                log.info("-" * 60)
                
                for i, device in enumerate(devices, 1):
                    log.info("Device #%d:", i)
                    log.info("  Drive Letter: %s", device.get("device_id", "Unknown"))
                    log.info("  Volume Name: %s", device.get("volume_name", "Unknown"))
                    log.info("  File System: %s", device.get("file_system", "Unknown"))
                    log.info("  Total Size: %.2f GB", device.get("size_gb", 0))
                    log.info("  Free Space: %.2f GB", device.get("free_gb", 0))
                    log.info("  Used Space: %.2f GB", device.get("used_gb", 0))
                    log.info("  Usage: %.1f%%", device.get("usage_percent", 0))
                    log.info("  Device Type: %s", device.get("device_type", "Unknown"))
                    log.info("-" * 40)
                
                log.info("=" * 60)
                log.info("USB DEVICES SUMMARY:")
                log.info("=" * 60)
                for device in devices:
                    log.info("✓ %s (%s) - %.2f GB free of %.2f GB", 
                            device.get("device_id", "Unknown"),
                            device.get("volume_name", "Unknown"),
                            device.get("free_gb", 0),
                            device.get("size_gb", 0))
            else:
                log.info("No USB devices detected.")
                log.info("Make sure USB devices are connected to the Windows host.")
            
            log.info("=" * 60)
            
        except Exception as e:
            log.error("Startup: Failed to get USB devices: %s", e)
            log.error("USB service communication error - check Windows host connection")
    else:
        log.warning("=" * 60)
        log.warning("USB SERVICE NOT AVAILABLE")
        log.warning("=" * 60)
        log.warning("USB service is not running on Windows host")
        log.warning("To start USB service, run:")
        log.warning("  python usb_service/usb_service.py")
        log.warning("=" * 60)
    
    # Log SecuGen SDK path
    usb_path = settings.SECUGEN_SDK_PATH
    log.info("Startup: SECUGEN_SDK_PATH=%s", usb_path)
    
    log.info("=" * 60)
    log.info("Backend startup completed successfully")
    log.info("=" * 60)

@app.get("/")
def root():
    """Root endpoint."""
    return APIResponse.success(
        data={
            "message": "Fingerprint Auth System - Hybrid Docker + Windows",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "usb_devices": "/usb",
                "usb_health": "/usb/health",
                "usb_status": "/usb/status",
                "enrollment": "/enroll",
                "admin": "/admin",
                "websocket": "/ws",
                "docs": "/docs"
            }
        },
        message="Fingerprint Auth System is running",
        meta={"version": "1.0.0", "architecture": "hybrid_docker_windows"}
    )

@app.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        usb_service_available = usb_client.is_service_available()
        
        health_data = {
            "status": "healthy",
            "backend": "running",
            "usb_service_available": usb_service_available,
            "secugen_connected": SecuGen.is_connected(),
            "database": "connected"
        }
        
        return APIResponse.success(
            data=health_data,
            message="System health check completed",
            meta={
                "backend_status": "running",
                "usb_service_available": usb_service_available,
                "secugen_connected": SecuGen.is_connected()
            }
        )
    except Exception as e:
        return APIResponse.error(
            message="Health check failed",
            status_code=503,
            error_code="HEALTH_CHECK_FAILED",
            details={"error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
