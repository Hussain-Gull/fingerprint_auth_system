"""
SecuGen SDK Installation Diagnostic
Purpose: Identify missing or improperly installed SDK components
"""

import os
import sys
from datetime import datetime

LOG_DIR = os.path.join(os.getcwd(), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "sdk_diagnostic.log")

def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = "[{}] {}".format(ts, msg)
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def check_file_exists(file_path, description):
    if os.path.isfile(file_path):
        size = os.path.getsize(file_path)
        log("FOUND: {} - {} - Size: {} bytes".format(description, file_path, size))
        return True
    else:
        log("MISSING: {} - {}".format(description, file_path))
        return False

def main():
    log("========================================")
    log("SecuGen SDK Installation Diagnostic")
    log("========================================")

    sdk_base = r"C:\secugen_sdk"

    if not os.path.isdir(sdk_base):
        log("CRITICAL ERROR: SDK base directory not found at {}".format(sdk_base))
        log("ACTION: Install SecuGen SDK or update SDK_PATH in script")
        return False

    log("SDK Base Directory: {}".format(sdk_base))
    log("")
    log("Checking 64-bit binaries...")

    required_files_x64 = [
        (os.path.join(sdk_base, "bin", "x64", "sgfplib.dll"), "Main FPM Library"),
        (os.path.join(sdk_base, "bin", "x64", "sgfpamx.dll"), "Algorithm Module (CRITICAL)"),
        (os.path.join(sdk_base, "bin", "x64", "sgwsqlib.dll"), "WSQ Module"),
    ]

    x64_status = True
    for file_path, desc in required_files_x64:
        if not check_file_exists(file_path, desc):
            x64_status = False

    log("")
    log("Checking header files...")

    header_files = [
        (os.path.join(sdk_base, "Inc", "sgfplib.h"), "SDK Header File"),
    ]

    for file_path, desc in header_files:
        check_file_exists(file_path, desc)

    log("")
    log("Checking library files...")

    lib_files = [
        (os.path.join(sdk_base, "Lib", "x64", "sgfplib.lib"), "Import Library 64-bit"),
    ]

    for file_path, desc in lib_files:
        check_file_exists(file_path, desc)

    log("")
    log("Checking sample files...")

    sample_files = [
        (os.path.join(sdk_base, "Samples"), "Sample Code Directory"),
    ]

    for file_path, desc in sample_files:
        if os.path.isdir(file_path):
            log("FOUND: {} - {}".format(desc, file_path))
        else:
            log("MISSING: {} - {}".format(desc, file_path))

    log("")
    log("========================================")
    if x64_status:
        log("RESULT: SDK installation appears COMPLETE")
        log("ACTION: Fingerprint capture script should work")
    else:
        log("RESULT: SDK installation is INCOMPLETE")
        log("ACTION: Reinstall SecuGen SDK and ensure all files are copied")
        log("")
        log("IMPORTANT: The algorithm module sgfpamx.dll is CRITICAL")
        log("This file must exist in: C:\\secugen_sdk\\bin\\x64\\sgfpamx.dll")
        log("")
        log("Installation steps:")
        log("1. Download complete SecuGen FDx SDK Pro from vendor")
        log("2. Run installer and select x64 components")
        log("3. Ensure installation path is C:\\secugen_sdk")
        log("4. Verify all files exist before running fingerprint script")

    log("========================================")
    return x64_status

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)