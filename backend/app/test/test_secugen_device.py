"""
Fixed SecuGen HUA20 Fingerprint Capture Script
----------------------------------------------
Purpose:
    - Verify device connectivity and SDK integration.
    - Blink LED twice to confirm readiness.
    - Capture a fingerprint interactively.
    - Log each step to console and to logs/test_device.log.

Usage:
    python test_secugen_device.py

Key Fixes:
    1. Corrected SGFPM function signatures (CDLL instead of WinDLL)
    2. Fixed GetImageEx parameters (HWND should be None, not 0)
    3. Added proper error handling and retries
    4. Fixed structure field types
    5. Added device brightness configuration
    6. Improved capture flow with Auto-On support
"""

import ctypes
import os
import sys
import time
from datetime import datetime

# --- Setup Logging ---
LOG_DIR = os.path.join(os.getcwd(), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "test_device.log")

def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = "[{}] {}".format(ts, msg)
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

# --- SDK PATHS ---
SDK_BASE = r"C:\secugen_sdk"
BIN_X64 = os.path.join(SDK_BASE, "bin", "x64")

DLL_SGFPAMX = os.path.join(BIN_X64, "sgfpamx.dll")
DLL_SGWSQLIB = os.path.join(BIN_X64, "sgwsqlib.dll")
DLL_SGFPLIB = os.path.join(BIN_X64, "sgfplib.dll")

log("===== SDK DLL Loading Initialization =====")

# Check all DLLs exist before loading
for dll_path, dll_name in [
    (DLL_SGFPAMX, "sgfpamx.dll"),
    (DLL_SGWSQLIB, "sgwsqlib.dll"),
    (DLL_SGFPLIB, "sgfplib.dll"),
]:
    if not os.path.isfile(dll_path):
        log("ERROR: {} not found at {}".format(dll_name, dll_path))
        sys.exit(1)
    log("OK: {} found - {}".format(dll_name, dll_path))

log("")
log("Loading dependent DLLs in correct order...")

# CRITICAL FIX: Use CDLL instead of windll for proper calling conventions
try:
    log("Loading sgfpamx.dll (Algorithm module)...")
    sgfpamx = ctypes.CDLL(DLL_SGFPAMX)
    log("SUCCESS: sgfpamx.dll loaded")
except Exception as e:
    log("ERROR: Failed to load sgfpamx.dll: {}".format(e))
    sys.exit(1)

try:
    log("Loading sgwsqlib.dll (WSQ module)...")
    sgwsqlib = ctypes.CDLL(DLL_SGWSQLIB)
    log("SUCCESS: sgwsqlib.dll loaded")
except Exception as e:
    log("ERROR: Failed to load sgwsqlib.dll: {}".format(e))
    sys.exit(1)

# NOW load main library after dependencies
try:
    log("Loading sgfplib.dll (Main FPM library)...")
    sg = ctypes.CDLL(DLL_SGFPLIB)
    log("SUCCESS: sgfplib.dll loaded")
except Exception as e:
    log("ERROR: Failed to load sgfplib.dll: {}".format(e))
    sys.exit(1)

log("SUCCESS: All DLLs loaded in correct dependency order")
log("")

# --- CONSTANTS ---
SGFDX_ERROR_NONE = 0
SG_DEV_AUTO = 255
USB_AUTO_DETECT = 0

# Template format constants
TEMPLATE_FORMAT_SG400 = 0x0200
TEMPLATE_FORMAT_ANSI378 = 0x0100
TEMPLATE_FORMAT_ISO19794 = 0x0300
TEMPLATE_FORMAT_ISO19794_COMPACT = 0x0400

# Finger position constants
SG_FINGPOS_UK = 0x00
SG_FINGPOS_RT = 0x01
SG_FINGPOS_RI = 0x02

# Impression type
SG_IMPTYPE_LP = 0x00

# Security levels
SL_NORMAL = 5

def check_result(label, result):
    if result == SGFDX_ERROR_NONE:
        log("SUCCESS: {}: Operation completed".format(label))
        return True
    else:
        log("ERROR: {}: Operation failed (Code {})".format(label, result))
        return False

def get_error_description(error_code):
    """Return human-readable error description based on error code"""
    error_messages = {
        0: "SGFDX_ERROR_NONE - No error",
        1: "SGFDX_ERROR_CREATION_FAILED - SGFPM object creation failed",
        2: "SGFDX_ERROR_FUNCTION_FAILED - Function call failed",
        3: "SGFDX_ERROR_INVALID_PARAM - Invalid parameter used",
        5: "SGFDX_ERROR_DLLLOAD_FAILED - DLL loading failed",
        6: "SGFDX_ERROR_DRVLOAD_FAILED - Device driver loading failed",
        7: "SGFDX_ERROR_DLLLOAD_FAILED_ALGO - Algorithm DLL loading failed",
        8: "SGFDX_ERROR_NO_LONGER_SUPPORTED - Function no longer supported",
        51: "SGFDX_ERROR_SYSLOAD_FAILED - Cannot find driver sys file",
        52: "SGFDX_ERROR_INITIALIZE_FAILED - Chip initialization failed",
        53: "SGFDX_ERROR_LINE_DROPPED - Image data lost",
        54: "SGFDX_ERROR_TIME_OUT - GetImageEx() timeout",
        55: "SGFDX_ERROR_DEVICE_NOT_FOUND - Device not found",
        56: "SGFDX_ERROR_DRVLOAD_FAILED - Driver file load failed",
        57: "SGFDX_ERROR_WRONG_IMAGE - Wrong image",
        58: "SGFDX_ERROR_LACK_OF_BANDWIDTH - Lack of USB bandwidth",
        59: "SGFDX_ERROR_DEV_ALREADY_OPEN - Device already opened",
        101: "SGFDX_ERROR_FEAT_NUMBER - Inadequate number of minutiae",
        102: "SGFDX_ERROR_INVALID_TEMPLATE_TYPE - Wrong template type",
        103: "SGFDX_ERROR_INVALID_TEMPLATE1 - Error while decoding template 1",
        104: "SGFDX_ERROR_INVALID_TEMPLATE2 - Error while decoding template 2",
    }
    return error_messages.get(error_code, "Unknown error code: {}".format(error_code))

# FIXED: Corrected structure definitions with proper types
class SGDeviceInfoParam(ctypes.Structure):
    _fields_ = [
        ("DeviceID", ctypes.c_ulong),      # DWORD = c_ulong
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

class SGFingerInfo(ctypes.Structure):
    _fields_ = [
        ("FingerNumber", ctypes.c_uint16),  # WORD = c_uint16
        ("ViewNumber", ctypes.c_uint16),
        ("ImpressionType", ctypes.c_uint16),
        ("ImageQuality", ctypes.c_uint16),
    ]

def configure_device_brightness(hFPM):
    """Configure device brightness for better capture"""
    log("Configuring device brightness...")
    # Set brightness to 50 (range 0-100)
    res = sg.SGFPM_SetBrightness(hFPM, ctypes.c_ulong(50))
    if res == SGFDX_ERROR_NONE:
        log("SUCCESS: Brightness set to 50")
    else:
        log("WARNING: Could not set brightness (Code: {})".format(res))

def capture_with_retry(hFPM, img_buffer, width, height, max_retries=3):
    """Attempt to capture fingerprint with retries"""
    timeout_ms = 15000  # 15 seconds
    quality_threshold = 30  # Lower threshold for initial capture

    for attempt in range(max_retries):
        log("Capture attempt {}/{}...".format(attempt + 1, max_retries))
        log("INFO: Place your finger firmly on the sensor")

        # FIXED: Pass None for HWND instead of 0
        res = sg.SGFPM_GetImageEx(
            hFPM,
            ctypes.cast(img_buffer, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.c_ulong(timeout_ms),
            None,  # HWND - pass None instead of ctypes.c_void_p(0)
            ctypes.c_ulong(quality_threshold)
        )

        if res == SGFDX_ERROR_NONE:
            log("SUCCESS: Fingerprint captured on attempt {}".format(attempt + 1))
            return True
        elif res == 54:  # Timeout
            log("WARNING: Timeout on attempt {}. Please try again.".format(attempt + 1))
            time.sleep(1)
        elif res == 57:  # Wrong image
            log("WARNING: No valid fingerprint detected. Ensure finger covers sensor.")
            time.sleep(1)
        else:
            log("ERROR: Capture failed with code {}".format(res))
            log("ERROR: {}".format(get_error_description(res)))
            time.sleep(1)

    return False

def main():
    log("========================================")
    log("Starting SecuGen HUA20 Fingerprint Capture")
    log("========================================")

    hFPM = ctypes.c_void_p()

    # Step 1: Create SGFPM object
    log("[STEP 1] Creating SGFPM object...")
    res = sg.SGFPM_Create(ctypes.byref(hFPM))
    if not check_result("SGFPM_Create", res):
        log("ERROR: Failed to create SGFPM object. {}".format(get_error_description(res)))
        return

    try:
        # Step 2: Initialize device with auto-detection
        log("[STEP 2] Initializing SGFPM with auto-detection...")
        res = sg.SGFPM_Init(hFPM, ctypes.c_ulong(SG_DEV_AUTO))
        if not check_result("SGFPM_Init", res):
            log("ERROR: Failed to initialize SGFPM. {}".format(get_error_description(res)))
            return

        # Step 3: Open device
        log("[STEP 3] Opening fingerprint reader device...")
        res = sg.SGFPM_OpenDevice(hFPM, ctypes.c_ulong(USB_AUTO_DETECT))
        if not check_result("SGFPM_OpenDevice", res):
            log("ERROR: Failed to open device. {}".format(get_error_description(res)))
            log("INFO: Make sure the device is connected via USB")
            log("INFO: Check Device Manager for 'SecuGen' devices")
            return

        # Step 4: Get device information
        log("[STEP 4] Retrieving device information...")
        info = SGDeviceInfoParam()
        res = sg.SGFPM_GetDeviceInfo(hFPM, ctypes.byref(info))
        if check_result("SGFPM_GetDeviceInfo", res):
            log("Device ID: {}".format(info.DeviceID))
            log("Serial Number: {}".format(info.DeviceSN.decode(errors='ignore')))
            log("Image Size: {}x{} pixels".format(info.ImageWidth, info.ImageHeight))
            log("Image DPI: {}".format(info.ImageDPI))
            log("Current Brightness: {}".format(info.Brightness))
            log("Firmware Version: 0x{:08X}".format(info.FWVersion))
        else:
            log("WARNING: Could not retrieve device info")
            # Use default values
            info.ImageWidth = 300
            info.ImageHeight = 400

        # Step 5: Configure brightness
        log("[STEP 5] Configuring device brightness...")
        configure_device_brightness(hFPM)

        # Step 6: Set template format to SG400
        log("[STEP 6] Setting template format to SG400...")
        res = sg.SGFPM_SetTemplateFormat(hFPM, ctypes.c_uint16(TEMPLATE_FORMAT_SG400))
        if not check_result("SGFPM_SetTemplateFormat", res):
            log("WARNING: Could not set template format")

        # Step 7: Get maximum template size
        log("[STEP 7] Determining maximum template size...")
        max_template_size = ctypes.c_ulong(0)
        res = sg.SGFPM_GetMaxTemplateSize(hFPM, ctypes.byref(max_template_size))
        if not check_result("SGFPM_GetMaxTemplateSize", res):
            log("ERROR: Could not determine template size. {}".format(get_error_description(res)))
            return

        log("Maximum template size: {} bytes".format(max_template_size.value))

        # Step 8: Blink LED twice
        log("[STEP 8] Blinking LED twice to indicate readiness...")
        for i in range(2):
            sg.SGFPM_SetLedOn(hFPM, ctypes.c_bool(True))
            time.sleep(0.3)
            sg.SGFPM_SetLedOn(hFPM, ctypes.c_bool(False))
            time.sleep(0.3)
        log("SUCCESS: LED blink sequence complete")

        # Step 9: Prompt user
        log("[STEP 9] Ready to capture fingerprint")
        log("=" * 50)
        log("INSTRUCTIONS:")
        log("1. Press ENTER to begin")
        log("2. Place your finger FIRMLY on the sensor")
        log("3. Make sure your finger is CLEAN and DRY")
        log("4. Cover the ENTIRE sensor surface")
        log("5. Keep finger STILL until capture completes")
        log("=" * 50)

        try:
            raw_input = input if sys.version_info[0] >= 3 else raw_input
            raw_input("Press ENTER to begin capture: ")
        except KeyboardInterrupt:
            log("Cancelled by user")
            return

        # Step 10: Capture fingerprint image
        log("[STEP 10] Capturing fingerprint image...")

        width = info.ImageWidth
        height = info.ImageHeight
        img_buf_size = width * height
        img_buffer = (ctypes.c_ubyte * img_buf_size)()

        # Use retry mechanism
        if not capture_with_retry(hFPM, img_buffer, width, height):
            log("ERROR: Failed to capture fingerprint after multiple attempts")
            log("TROUBLESHOOTING:")
            log("- Ensure finger is clean and dry")
            log("- Apply firm, steady pressure")
            log("- Cover entire sensor surface")
            log("- Try a different finger")
            return

        # Step 11: Save raw image
        log("[STEP 11] Saving raw fingerprint image...")
        raw_path = os.path.join(LOG_DIR, "fingerprint_image.raw")
        try:
            with open(raw_path, "wb") as f:
                f.write(bytes(img_buffer))
            log("SUCCESS: Raw image saved to {}".format(raw_path))
        except Exception as e:
            log("ERROR: Could not save raw image: {}".format(e))

        # Step 12: Verify image quality
        log("[STEP 12] Verifying image quality...")
        img_quality = ctypes.c_ulong(0)
        res = sg.SGFPM_GetImageQuality(
            hFPM,
            ctypes.c_ulong(width),
            ctypes.c_ulong(height),
            ctypes.cast(img_buffer, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.byref(img_quality)
        )

        if check_result("SGFPM_GetImageQuality", res):
            log("Image quality score: {}".format(img_quality.value))
            if img_quality.value >= 50:
                log("INFO: EXCELLENT - Image quality suitable for registration")
            elif img_quality.value >= 40:
                log("INFO: GOOD - Image quality acceptable for verification")
            else:
                log("WARNING: LOW - Consider recapturing with better technique")
        else:
            log("WARNING: Could not verify quality")
            img_quality.value = 50  # Use default for template creation

        # Step 13: Create template
        log("[STEP 13] Creating fingerprint template...")

        finger_info = SGFingerInfo()
        finger_info.FingerNumber = SG_FINGPOS_RT
        finger_info.ViewNumber = 0
        finger_info.ImpressionType = SG_IMPTYPE_LP
        finger_info.ImageQuality = img_quality.value

        template_buf = (ctypes.c_ubyte * max_template_size.value)()

        res = sg.SGFPM_CreateTemplate(
            hFPM,
            ctypes.byref(finger_info),
            ctypes.cast(img_buffer, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.cast(template_buf, ctypes.POINTER(ctypes.c_ubyte))
        )

        if not check_result("SGFPM_CreateTemplate", res):
            log("ERROR: Template creation failed. {}".format(get_error_description(res)))
            if res == 101:
                log("INFO: Try recapturing - inadequate minutiae detected")
            return

        log("SUCCESS: Template created successfully")

        # Step 14: Get template size and save
        log("[STEP 14] Saving template file...")
        template_size = ctypes.c_ulong(0)
        res = sg.SGFPM_GetTemplateSize(
            hFPM,
            ctypes.cast(template_buf, ctypes.POINTER(ctypes.c_ubyte)),
            ctypes.byref(template_size)
        )

        if check_result("SGFPM_GetTemplateSize", res):
            log("Actual template size: {} bytes".format(template_size.value))

            tmpl_path = os.path.join(LOG_DIR, "fingerprint_template.bin")
            try:
                with open(tmpl_path, "wb") as f:
                    f.write(bytes(template_buf[:template_size.value]))
                log("SUCCESS: Template saved to {}".format(tmpl_path))
            except Exception as e:
                log("ERROR: Could not save template: {}".format(e))

        log("========================================")
        log("FINGERPRINT CAPTURE SUCCESSFUL")
        log("========================================")
        log("Files saved to: {}".format(LOG_DIR))
        log("")
        log("Next Steps:")
        log("- Raw image: fingerprint_image.raw ({} bytes)".format(img_buf_size))
        log("- Template: fingerprint_template.bin ({} bytes)".format(template_size.value))
        log("- Quality: {} (Recommended: 50+)".format(img_quality.value))

    finally:
        # Cleanup - ALWAYS execute
        log("")
        log("[CLEANUP] Closing device and terminating...")
        try:
            res = sg.SGFPM_CloseDevice(hFPM)
            check_result("SGFPM_CloseDevice", res)
        except:
            pass

        try:
            res = sg.SGFPM_Terminate(hFPM)
            check_result("SGFPM_Terminate", res)
        except:
            pass


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("")
        log("Test interrupted by user")
    except Exception as e:
        log("")
        log("EXCEPTION: {}".format(e))
        import traceback
        log(traceback.format_exc())