"""
USB Service Client
=================
Client for communicating with the Windows-native USB detection service.
This module handles HTTP communication with the USB service running on the host.
"""

import requests
import logging
from typing import List, Dict, Optional
from fastapi import HTTPException

log = logging.getLogger("usb_service_client")

class USBServiceClient:
    """Client for communicating with the USB detection service."""
    
    def __init__(self, base_url: str = "http://host.docker.internal:6000"):
        self.base_url = base_url.rstrip('/')
        self.timeout = 10  # seconds
        
    def _make_request(self, endpoint: str, method: str = "GET", **kwargs) -> Dict:
        """Make HTTP request to USB service."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, timeout=self.timeout, **kwargs)
            elif method.upper() == "POST":
                response = requests.post(url, timeout=self.timeout, **kwargs)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.ConnectionError:
            log.error(f"Failed to connect to USB service at {url}")
            raise HTTPException(
                status_code=503,
                detail="USB service unavailable. Make sure the USB service is running on the Windows host."
            )
        except requests.exceptions.Timeout:
            log.error(f"Request timeout to USB service at {url}")
            raise HTTPException(
                status_code=504,
                detail="USB service request timeout"
            )
        except requests.exceptions.HTTPError as e:
            log.error(f"HTTP error from USB service: {e}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"USB service error: {e.response.text}"
            )
        except Exception as e:
            log.error(f"Unexpected error communicating with USB service: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"USB service communication error: {str(e)}"
            )
    
    def health_check(self) -> Dict:
        """Check if USB service is healthy."""
        return self._make_request("/health")
    
    def get_usb_devices(self) -> Dict:
        """Get list of USB devices from the service."""
        return self._make_request("/usb-devices")
    
    def get_usb_device(self, device_id: str) -> Dict:
        """Get specific USB device by ID."""
        return self._make_request(f"/usb-devices/{device_id}")
    
    def refresh_usb_devices(self) -> Dict:
        """Refresh USB device list."""
        return self._make_request("/usb-devices/refresh", method="POST")
    
    def is_service_available(self) -> bool:
        """Check if USB service is available."""
        try:
            self.health_check()
            return True
        except HTTPException:
            return False

# Global USB service client instance
usb_client = USBServiceClient()
