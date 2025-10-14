"""
USB Service - Windows Native USB Detection Service
================================================
A Windows-native service that detects USB devices using WMI and exposes them via Flask API.
This service runs on the Windows host and communicates with the Docker backend via HTTP.

Requirements:
- Windows OS
- Python 3.11+
- flask, wmi, pywin32 packages

Usage:
    python usb_service.py

API Endpoints:
    GET /usb-devices - Returns list of connected USB devices
    GET /health - Health check endpoint
"""

import os
import sys
import logging
import platform
import contextlib
import io
import gc
from typing import List, Dict, Optional
from flask import Flask, jsonify
from flask_cors import CORS
import wmi
import pythoncom

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
log = logging.getLogger("usb_service")

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests


# ------------------------ Helper to silence COM stderr ------------------------
@contextlib.contextmanager
def suppress_stderr():
    """Suppress stderr noise from WMI COM release (IUnknown warnings)."""
    saved_stderr = sys.stderr
    sys.stderr = io.StringIO()
    try:
        yield
    finally:
        sys.stderr = saved_stderr


# ----------------------------- USB Device Model -------------------------------
class USBDevice:
    """Represents a USB device with detailed information."""

    def __init__(self, device_id: str, volume_name: str, size_gb: float,
                 free_gb: float, file_system: str, device_type: str = "USB"):
        self.device_id = device_id
        self.volume_name = volume_name or "<No Label>"
        self.size_gb = round(size_gb, 2)
        self.free_gb = round(free_gb, 2)
        self.file_system = file_system
        self.device_type = device_type
        self.used_gb = round(size_gb - free_gb, 2)
        self.usage_percent = round((self.used_gb / size_gb * 100), 1) if size_gb > 0 else 0

    def to_dict(self) -> Dict[str, any]:
        return {
            "device_id": self.device_id,
            "volume_name": self.volume_name,
            "size_gb": self.size_gb,
            "free_gb": self.free_gb,
            "used_gb": self.used_gb,
            "usage_percent": self.usage_percent,
            "file_system": self.file_system,
            "device_type": self.device_type
        }

    def __repr__(self):
        return f"{self.device_id} ({self.volume_name}) [{self.free_gb}/{self.size_gb} GB free]"


# ---------------------------- USB Detection Logic -----------------------------
class USBDetector:
    """Detects USB devices using Windows WMI API."""

    def __init__(self):
        self.os = platform.system()
        self.devices: List[USBDevice] = []
        if self.os != "Windows":
            log.error("USB detection service requires Windows OS")
            raise RuntimeError("USB detection service requires Windows OS")

    def _initialize_com(self):
        try:
            pythoncom.CoInitialize()
            return True
        except Exception:
            return False

    def _uninitialize_com(self):
        try:
            pythoncom.CoUninitialize()
        except Exception:
            pass

    def detect_usb_devices(self) -> List[USBDevice]:
        """Detect all USB-connected devices using WMI."""
        devices = []
        com_initialized = self._initialize_com()

        try:
            with suppress_stderr():  # suppress WMI internal noise
                c = wmi.WMI()

                log.info("Scanning for removable USB drives...")
                for drive in c.Win32_LogicalDisk(DriveType=2):
                    try:
                        device_id = drive.DeviceID
                        volume_name = drive.VolumeName or "<No Label>"
                        file_system = drive.FileSystem or "Unknown"

                        size_bytes = int(drive.Size) if drive.Size else 0
                        free_bytes = int(drive.FreeSpace) if drive.FreeSpace else 0

                        size_gb = size_bytes / (1024**3)
                        free_gb = free_bytes / (1024**3)

                        usb_device = USBDevice(
                            device_id=device_id,
                            volume_name=volume_name,
                            size_gb=size_gb,
                            free_gb=free_gb,
                            file_system=file_system,
                            device_type="USB"
                        )
                        devices.append(usb_device)
                        log.info(f"Detected USB device: {usb_device}")

                    except Exception as e:
                        log.warning(f"Error processing drive {drive.DeviceID}: {e}")

                log.info("Scanning for USB storage hubs...")
                for usb_device in c.Win32_USBHub():
                    if hasattr(usb_device, 'Description') and 'storage' in usb_device.Description.lower():
                        log.debug(f"USB hub: {usb_device.Description}")

                for usb_storage in c.Win32_USBController():
                    if hasattr(usb_storage, 'Description'):
                        log.debug(f"USB controller: {usb_storage.Description}")

        except Exception as e:
            log.error(f"Error detecting USB devices: {e}")
        finally:
            gc.collect()  # ensure COM objects destroyed before uninit
            if com_initialized:
                with suppress_stderr():
                    self._uninitialize_com()

        self.devices = devices
        log.info(f"USB detection completed. Found {len(devices)} devices.")
        return devices

    def get_device_by_id(self, device_id: str) -> Optional[USBDevice]:
        for device in self.devices:
            if device.device_id.lower() == device_id.lower():
                return device
        return None

    def refresh_devices(self) -> List[USBDevice]:
        return self.detect_usb_devices()


# ---------------------------- Flask API Endpoints -----------------------------
usb_detector = USBDetector()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "USB Detection Service",
        "os": platform.system(),
        "python_version": sys.version,
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })

@app.route('/usb-devices', methods=['GET'])
def get_usb_devices():
    try:
        devices = usb_detector.refresh_devices()
        devices_data = [d.to_dict() for d in devices]
        return jsonify({
            "status": "success",
            "count": len(devices_data),
            "devices": devices_data
        })
    except Exception as e:
        log.error(f"Error getting USB devices: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/usb-devices/<device_id>', methods=['GET'])
def get_usb_device(device_id: str):
    try:
        device = usb_detector.get_device_by_id(device_id)
        if device:
            return jsonify({"status": "success", "device": device.to_dict()})
        return jsonify({"status": "error", "message": f"Device {device_id} not found"}), 404
    except Exception as e:
        log.error(f"Error fetching device {device_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/usb-devices/refresh', methods=['POST'])
def refresh_usb_devices():
    try:
        devices = usb_detector.refresh_devices()
        devices_data = [d.to_dict() for d in devices]
        return jsonify({
            "status": "success",
            "message": "USB devices refreshed",
            "count": len(devices_data),
            "devices": devices_data
        })
    except Exception as e:
        log.error(f"Error refreshing USB devices: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------- Main Entry -----------------------------------
def main():
    log.info("Starting USB Detection Service...")
    log.info(f"Platform: {platform.system()} {platform.release()}")
    log.info(f"Python version: {sys.version}")

    if platform.system() != "Windows":
        log.error("This service requires Windows OS")
        sys.exit(1)

    try:
        with suppress_stderr():
            wmi.WMI()
        log.info("WMI connection successful")
    except Exception as e:
        log.error(f"WMI connection failed: {e}")
        sys.exit(1)

    log.info("Performing initial USB detection...")
    with suppress_stderr():
        devices = usb_detector.detect_usb_devices()
    log.info(f"Initial detection found {len(devices)} USB devices")

    log.info("Starting Flask server on port 6000...")
    app.run(host='0.0.0.0', port=6000, debug=False, threaded=False)


if __name__ == "__main__":
    main()
