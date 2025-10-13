"""
Thin, documented ctypes wrapper over SecuGen FDx SDK DLLs.
This module provides a safe stubbed behavior when DLLs are not available so the rest of the app runs in dev.

IMPORTANT:
- When deploying on Windows with SDK at E:\FDx SDK Pro for Windows v4.3.1_J1.12 set SECUGEN_SDK_PATH environment var.
- The SDK manual documents required functions: SGFPM_Create, SGFPM_Init, SGFPM_OpenDevice, SGFPM_CreateTemplate,
  SGFPM_MatchTemplate, SGFPM_GetDeviceInfo, SGFPM_Terminate. Implement real calls here using ctypes if you want native integration.
  See FDx SDK Pro manual functions. :contentReference[oaicite:5]{index=5}
"""

import os
import ctypes
import logging
from typing import Optional, Tuple

log = logging.getLogger("secugen_binding")
SDK_PATH = os.getenv("SECUGEN_SDK_PATH")  # e.g. E:\FDx SDK Pro for Windows v4.3.1_J1.12

class SecuGenStub:
    def __init__(self):
        self.device_open = False
        self.template_format = "SG400"
    def connect(self):
        # Try to load DLLs if path present, otherwise stub
        if SDK_PATH and os.path.exists(SDK_PATH):
            log.info("SDK path set. Attempt to load DLLs from %s", SDK_PATH)
            # Real loader example (uncomment & implement):
            # dll_path = os.path.join(SDK_PATH, "Bin", "x64", "sgfplib.dll")
            # self.dll = ctypes.WinDLL(dll_path)
            # call SGFPM_Create etc...
            # For now, keep stub behaviour until developer maps functions.
            self.device_open = True
            return True
        log.warning("SECUGEN_SDK_PATH not set or not found; using stub device.")
        self.device_open = False
        return False

    def is_connected(self) -> bool:
        return self.device_open

    def get_device_info(self) -> dict:
        # If real device loaded, call SGFPM_GetDeviceInfo
        if self.device_open:
            return {"DeviceID": 0, "DeviceSN": "STUB123", "ImageWidth": 300, "ImageHeight": 400}
        return {}

    def capture_template(self, timeout_ms: int = 5000, quality: int = 80) -> Tuple[bool, Optional[bytes]]:
        """
        Capture fingerprint and return (ok, template_bytes)
        - When using real SDK, call SGFPM_GetImageEx then SGFPM_CreateTemplate and SGFPM_GetTemplateSize.
        - Documented in SDK manual (SGFPM_GetImageEx, SGFPM_CreateTemplate, SGFPM_GetMaxTemplateSize). :contentReference[oaicite:6]{index=6}
        """
        if not self.device_open:
            return False, None
        # STUB: return deterministic fake template
        return True, b"STUB_TEMPLATE_" + os.urandom(16)

    def match_template(self, probe: bytes, candidate: bytes) -> Tuple[bool, int]:
        """
        Use SGFPM_MatchTemplate/SGFPM_MatchTemplateEx in real integration.
        Returns (matched, score)
        """
        # STUB: simple equality check (not real biometric matching)
        if probe == candidate:
            return True, 200
        return False, 10

    def close(self):
        self.device_open = False

# Export fallback binding
SecuGen = SecuGenStub()
