"""
SecuGen Fingerprint Device Service
----------------------------------
Handles all interactions with SecuGen fingerprint reader hardware.

Key Process Flow:
1. Create device object
2. Initialize with device type (auto-detect)
3. Open device connection
4. Capture IMAGE (raw pixels)
5. Verify image quality
6. Create TEMPLATE from image (minutiae extraction)
7. Use template for matching/storage
"""

import ctypes
import os
import time
from typing import Optional, Dict, Any
from app.utils.logger import logger


class SecuGenError(Exception):
    """Custom exception for SecuGen device errors."""
    pass


class SecuGenDevice:
    """
    SecuGen fingerprint device interface.
    Implements proper SDK workflow: Image capture → Template creation
    """

    # SDK paths
    SDK_BASE = r"C:\secugen_sdk"
    BIN_X64 = os.path.join(SDK_BASE, "bin", "x64")
    
    # DLL paths
    DLL_SGFPAMX = os.path.join(BIN_X64, "sgfpamx.dll")
    DLL_SGWSQLIB = os.path.join(BIN_X64, "sgwsqlib.dll")
    DLL_SGFPLIB = os.path.join(BIN_X64, "sgfplib.dll")

    # Error codes
    SGFDX_ERROR_NONE = 0
    SGFDX_ERROR_TIMEOUT = 54
    SGFDX_ERROR_WRONG_IMAGE = 57
    SGFDX_ERROR_FEAT_NUMBER = 101

    # Device constants
    SG_DEV_AUTO = 255
    USB_AUTO_DETECT = 0
    
    # Template formats
    TEMPLATE_FORMAT_SG400 = 0x0200
    TEMPLATE_FORMAT_ANSI378 = 0x0100
    
    # Finger positions
    SG_FINGPOS_RT = 0x01  # Right thumb
    
    # Impression type
    SG_IMPTYPE_LP = 0x00  # Live-scan plain

    # Class-level SDK library (shared across instances)
    _sg = None
    _sdk_loaded = False

    def __init__(self):
        """Initialize device wrapper (does not connect to hardware yet)."""
        self.hFPM = ctypes.c_void_p()
        self.width = 0
        self.height = 0
        self.max_template_size = 0
        self._ensure_sdk_loaded()

    @classmethod
    def _ensure_sdk_loaded(cls):
        """
        Load SDK DLLs once per process.
        CRITICAL: Use CDLL (not WinDLL) for correct calling convention.
        """
        if cls._sdk_loaded:
            return

        logger.info("Loading SecuGen SDK DLLs...")

        # Verify all DLLs exist
        for dll_path, dll_name in [
            (cls.DLL_SGFPAMX, "sgfpamx.dll"),
            (cls.DLL_SGWSQLIB, "sgwsqlib.dll"),
            (cls.DLL_SGFPLIB, "sgfplib.dll"),
        ]:
            if not os.path.isfile(dll_path):
                raise SecuGenError(f"SDK DLL not found: {dll_path}")

        try:
            # Load dependencies first (MUST be in this order)
            ctypes.CDLL(cls.DLL_SGFPAMX)
            logger.debug("Loaded sgfpamx.dll")
            
            ctypes.CDLL(cls.DLL_SGWSQLIB)
            logger.debug("Loaded sgwsqlib.dll")
            
            # Load main library
            cls._sg = ctypes.CDLL(cls.DLL_SGFPLIB)
            logger.debug("Loaded sgfplib.dll")
            
            cls._sdk_loaded = True
            logger.info("SecuGen SDK loaded successfully")

        except Exception as e:
            raise SecuGenError(f"Failed to load SDK: {e}")

    @property
    def sg(self):
        """Get SDK library instance."""
        return self.__class__._sg

    def _check_error(self, operation: str, error_code: int):
        """Check error code and raise exception if not successful."""
        if error_code == self.SGFDX_ERROR_NONE:
            return True

        error_msg = self._get_error_description(error_code)
        logger.error("%s failed: %s (Code: %d)", operation, error_msg, error_code)
        raise SecuGenError(f"{operation} failed: {error_msg} (Code: {error_code})")

    def _get_error_description(self, error_code: int) -> str:
        """Get human-readable error description."""
        error_messages = {
            0: "No error",
            1: "SGFPM object creation failed",
            2: "Function call failed",
            3: "Invalid parameter",
            5: "DLL loading failed",
            6: "Device driver loading failed",
            7: "Algorithm DLL loading failed",
            51: "Cannot find driver sys file",
            52: "Chip initialization failed",
            53: "Image data lost",
            54: "Capture timeout - no finger detected",
            55: "Device not found",
            56: "Driver file load failed",
            57: "Wrong image - no valid fingerprint detected",
            58: "Lack of USB bandwidth",
            101: "Inadequate number of minutiae",
            102: "Wrong template type",
            103: "Error decoding template 1",
            104: "Error decoding template 2",
        }
        return error_messages.get(error_code, f"Unknown error code: {error_code}")

    # ============================================================
    # Device Lifecycle
    # ============================================================

    def create(self):
        """Create SGFPM object."""
        logger.debug("Creating SGFPM object...")
        res = self.sg.SGFPM_Create(ctypes.byref(self.hFPM))
        self._check_error("SGFPM_Create", res)
        logger.info("SGFPM object created")

    def init(self, device_name: int = None):
        """
        Initialize SGFPM with device type.
        
        Args:
            device_name: Device type constant (default: SG_DEV_AUTO for auto-detect)
        """
        if device_name is None:
            device_name = self.SG_DEV_AUTO

        logger.debug("Initializing SGFPM (device_name=%d)...", device_name)
        res = self.sg.SGFPM_Init(self.hFPM, ctypes.c_ulong(device_name))
        self._check_error("SGFPM_Init", res)
        logger.info("SGFPM initialized")

    def open(self, device_id: int = USB_AUTO_DETECT):
        """
        Open connection to fingerprint reader.
        
        Args:
            device_id: Device ID (0-9 for multiple devices, USB_AUTO_DETECT for auto)
        """
        logger.debug("Opening device (device_id=%d)...", device_id)
        res = self.sg.SGFPM_OpenDevice(self.hFPM, ctypes.c_ulong(device_id))
        self._check_error("SGFPM_OpenDevice", res)
        logger.info("Device opened successfully")

        # Get device info after opening
        self._load_device_info()

    def close(self):
        """Close device connection."""
        if not self.hFPM:
            return

        logger.debug("Closing device...")
        try:
            res = self.sg.SGFPM_CloseDevice(self.hFPM)
            if res == self.SGFDX_ERROR_NONE:
                logger.info("Device closed")
            else:
                logger.warning("Device close returned code %d", res)
        except Exception as e:
            logger.warning("Error closing device: %s", e)

    def terminate(self):
        """Terminate SGFPM object and free resources."""
        if not self.hFPM:
            return

        logger.debug("Terminating SGFPM...")
        try:
            res = self.sg.SGFPM_Terminate(self.hFPM)
            if res == self.SGFDX_ERROR_NONE:
                logger.info("SGFPM terminated")
            else:
                logger.warning("SGFPM terminate returned code %d", res)
        except Exception as e:
            logger.warning("Error terminating SGFPM: %s", e)
        finally:
            self.hFPM = ctypes.c_void_p()

    # ============================================================
    # Device Information & Configuration
    # ============================================================

    def _load_device_info(self):
        """Load device information (width, height, etc.)."""
        class SGDeviceInfoParam(ctypes.Structure):
            _fields_ = [
                ("DeviceID", ctypes.c_ulong),
                ("DeviceSN", ctypes.c_char * 16),
                ("ComPort", ctypes.c_ulong),
                ("ComSpeed", ctypes.c_ulong),
                ("ImageWidth", ctypes.c_ulong),
                ("ImageHeight", ctypes.c_ulong),
                ("Contrast", ctypes.c_ulong),
                ("Brightness", ctypes.c_ulong),
                ("Gain", ctypes.c_ulong),
                ("ImageDPI", ctypes.c_ulong),
                ("FWVersion", ctypes.c_ulong),
            ]

        info = SGDeviceInfoParam()
        res = self.sg.SGFPM_GetDeviceInfo(self.hFPM, ctypes.byref(info))
        
        if res == self.SGFDX_ERROR_NONE:
            self.width = info.ImageWidth
            self.height = info.ImageHeight
            logger.info("Device info: %dx%d pixels, DPI=%d, SN=%s",
                       self.width, self.height, info.ImageDPI,
                       info.DeviceSN.decode(errors='ignore'))
        else:
            logger.warning("Could not get device info, using defaults")
            self.width = 300
            self.height = 400

    def get_device_info(self) -> Dict[str, Any]:
        """
        Get device information.
        
        Returns:
            dict: Device information including width, height, etc.
        """
        return {
            'width': self.width,
            'height': self.height,
        }

    def set_brightness(self, brightness: int):
        """
        Set device brightness (0-100).
        
        Args:
            brightness: Brightness level (0-100, recommended: 50)
        """
        logger.debug("Setting brightness to %d...", brightness)
        res = self.sg.SGFPM_SetBrightness(self.hFPM, ctypes.c_ulong(brightness))
        if res == self.SGFDX_ERROR_NONE:
            logger.debug("Brightness set successfully")
        else:
            logger.warning("Could not set brightness (code %d)", res)

    def set_template_format(self, format_type: int = None):
        """
        Set template format.
        
        Args:
            format_type: Template format constant (default: TEMPLATE_FORMAT_SG400)
        """
        if format_type is None:
            format_type = self.TEMPLATE_FORMAT_SG400

        logger.debug("Setting template format to 0x%04X...", format_type)
        res = self.sg.SGFPM_SetTemplateFormat(self.hFPM, ctypes.c_uint16(format_type))
        self._check_error("SGFPM_SetTemplateFormat", res)
        
        # Get max template size after setting format
        max_size = ctypes.c_ulong(0)
        res = self.sg.SGFPM_GetMaxTemplateSize(self.hFPM, ctypes.byref(max_size))
        self._check_error("SGFPM_GetMaxTemplateSize", res)
        self.max_template_size = max_size.value
        logger.info("Template format set. Max template size: %d bytes", self.max_template_size)

    # ============================================================
    # LED Control
    # ============================================================

    def set_led(self, on: bool):
        """
        Turn LED on or off.
        
        Args:
            on: True to turn on, False to turn off
        """
        self.sg.SGFPM_SetLedOn(self.hFPM, ctypes.c_bool(on))

    def blink_led(self, times: int = 2, interval: float = 0.3):
        """
        Blink LED multiple times.
        
        Args:
            times: Number of blinks
            interval: Interval between blinks in seconds
        """
        logger.debug("Blinking LED %d times...", times)
            for _ in range(times):
                self.set_led(True)
                time.sleep(interval)
                self.set_led(False)
                time.sleep(interval)

    # ============================================================
    # Image Capture (Step 1 of fingerprint capture)
    # ============================================================

    def capture_image_ex(self, timeout_ms: int = 10000, quality_threshold: int = 30) -> Optional[bytes]:
        """
        Capture fingerprint IMAGE with quality checking.
        
        This is STEP 1: Capture the raw image first.
        Use create_template() afterward to extract features.
        
        Args:
            timeout_ms: Timeout in milliseconds
            quality_threshold: Minimum quality threshold (0-100)
            
        Returns:
            bytes: Raw image buffer if successful, None otherwise
            
        Raises:
            SecuGenError: On capture failure
        """
        logger.debug("Capturing image (timeout=%dms, quality=%d)...", timeout_ms, quality_threshold)

        # Allocate image buffer
        img_size = self.width * self.height
        img_buffer = (ctypes.c_ubyte * img_size)()

        # Capture image with quality checking
        # CRITICAL: Pass None for HWND, not 0
        res = self.sg.SGFPM_GetImageEx(
            self.hFPM,
            ctypes.cast(img_buffer, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.c_ulong(timeout_ms),
            None,  # HWND - must be None
            ctypes.c_ulong(quality_threshold)
        )

        if res == self.SGFDX_ERROR_NONE:
            logger.info("Image captured successfully (%d bytes)", img_size)
            return bytes(img_buffer)
        elif res == self.SGFDX_ERROR_TIMEOUT:
            logger.warning("Capture timeout - no finger detected")
            raise TimeoutError("No finger detected within timeout period")
        elif res == self.SGFDX_ERROR_WRONG_IMAGE:
            logger.warning("Wrong image - no valid fingerprint")
            raise SecuGenError("No valid fingerprint detected")
        else:
            self._check_error("SGFPM_GetImageEx", res)
            return None

    def get_image_quality(self, img_buffer: bytes, width: int, height: int) -> int:
        """
        Get quality score of captured image.
        
        Args:
            img_buffer: Raw image bytes
            width: Image width
            height: Image height
            
        Returns:
            int: Quality score (0-100)
        """
        logger.debug("Checking image quality...")
        
        # Convert bytes to ctypes array
        img_array = (ctypes.c_ubyte * len(img_buffer)).from_buffer_copy(img_buffer)
        quality = ctypes.c_ulong(0)

        res = self.sg.SGFPM_GetImageQuality(
            self.hFPM,
            ctypes.c_ulong(width),
            ctypes.c_ulong(height),
            ctypes.cast(img_array, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.byref(quality)
        )

        if res == self.SGFDX_ERROR_NONE:
            logger.debug("Image quality: %d", quality.value)
            return quality.value
        else:
            logger.warning("Could not determine quality (code %d)", res)
            return 0

    # ============================================================
    # Template Creation (Step 2 of fingerprint capture)
    # ============================================================

    def create_template(self, img_buffer: bytes, quality: int = 50) -> Optional[bytes]:
        """
        Create fingerprint TEMPLATE from captured image.
        
        This is STEP 2: Extract minutiae features from the raw image.
        Call this AFTER capture_image_ex().
        
        Args:
            img_buffer: Raw image bytes from capture_image_ex()
            quality: Image quality score
            
        Returns:
            bytes: Template data if successful, None otherwise
            
        Raises:
            SecuGenError: On template creation failure
        """
        logger.debug("Creating template from image...")

        if self.max_template_size == 0:
            raise SecuGenError("Template format not set. Call set_template_format() first.")

        # Prepare finger info structure
        class SGFingerInfo(ctypes.Structure):
            _fields_ = [
                ("FingerNumber", ctypes.c_uint16),
                ("ViewNumber", ctypes.c_uint16),
                ("ImpressionType", ctypes.c_uint16),
                ("ImageQuality", ctypes.c_uint16),
            ]

        finger_info = SGFingerInfo()
        finger_info.FingerNumber = self.SG_FINGPOS_RT
        finger_info.ViewNumber = 0
        finger_info.ImpressionType = self.SG_IMPTYPE_LP
        finger_info.ImageQuality = quality

        # Allocate template buffer
        template_buffer = (ctypes.c_ubyte * self.max_template_size)()

        # Convert image buffer to ctypes array
        img_array = (ctypes.c_ubyte * len(img_buffer)).from_buffer_copy(img_buffer)

        # Create template
        res = self.sg.SGFPM_CreateTemplate(
            self.hFPM,
            ctypes.byref(finger_info),
            ctypes.cast(img_array, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.cast(template_buffer, ctypes.POINTER(ctypes.c_ubyte))
        )

        if res == self.SGFDX_ERROR_NONE:
            # Get actual template size
            template_size = ctypes.c_ulong(0)
            res2 = self.sg.SGFPM_GetTemplateSize(
                self.hFPM,
                ctypes.cast(template_buffer, ctypes.POINTER(ctypes.c_ubyte)),
                ctypes.byref(template_size)
            )

            if res2 == self.SGFDX_ERROR_NONE:
                actual_size = template_size.value
                logger.info("Template created successfully (%d bytes)", actual_size)
                return bytes(template_buffer[:actual_size])
            else:
                logger.warning("Could not get template size, using max size")
                return bytes(template_buffer)

        elif res == self.SGFDX_ERROR_FEAT_NUMBER:
            logger.warning("Inadequate number of minutiae in image")
            raise SecuGenError("Inadequate number of minutiae - try again with better finger placement")
        else:
            self._check_error("SGFPM_CreateTemplate", res)
            return None


# -----------------------------
# Device Connectivity Test
# -----------------------------
def device_check() -> tuple[bool, Optional[str]]:
    """Simple test for API health checks."""
    try:
        dev = SecuGenDevice()
        dev.create()
        dev.init()
        dev.open(0)
        dev.get_device_info()
        dev.close()
        dev.terminate()
        return True, None
    except Exception as e:
        return False, str(e)
