#!/usr/bin/env python3
"""
usb_write_dummy.py

Simple script to test writing dummy student records (CNIC + dummy fingerprint)
to a USB removable drive on Windows.

Usage:
    python usb_write_dummy.py                # auto-detect first removable drive, JSON, 5 records
    python usb_write_dummy.py --drive E      # write to drive E:
    python usb_write_dummy.py --format csv --count 10
"""

import os
import sys
import json
import csv
import argparse
import platform
import logging
import random
import string
import time
import gc

try:
    import wmi
    import pythoncom
except Exception as e:
    print("Missing dependency. Install with: pip install wmi pywin32")
    raise

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("usb_write_dummy")

def ensure_windows():
    if platform.system() != "Windows":
        log.error("This script must run on Windows (uses WMI to detect removable drives).")
        sys.exit(1)

def co_initialize():
    try:
        pythoncom.CoInitialize()
    except Exception:
        pass

def co_uninitialize():
    try:
        pythoncom.CoUninitialize()
    except Exception:
        pass

def find_first_removable_drive():
    co_initialize()
    try:
        c = wmi.WMI()
        drives = c.Win32_LogicalDisk(DriveType=2)  # removable
        if not drives:
            return None
        # Return first drive letter, e.g., "E:"
        return drives[0].DeviceID  # "E:"
    finally:
        # force GC to avoid COM release warnings
        gc.collect()
        co_uninitialize()

def normalize_drive_param(drive_param: str) -> str:
    # Accept "E", "E:", or "E:\"
    drive = drive_param.strip()
    if len(drive) == 1 and drive.isalpha():
        drive = f"{drive}:"
    drive = drive.rstrip("\\/")
    return drive

def generate_dummy_cnic() -> str:
    # Pakistani CNIC-like: 13 digits (no dashes)
    return "".join(random.choices("0123456789", k=13))

def generate_dummy_fingerprint_blob(length=128) -> str:
    # Represent "fingerprint template" as base64-like random string (not real)
    return "".join(random.choices(string.ascii_letters + string.digits + "+/", k=length))

def build_dummy_records(count: int):
    records = []
    for i in range(1, count + 1):
        rec = {
            "student_id": f"S{i:05d}",
            "name": f"Dummy Student {i}",
            "cnic": generate_dummy_cnic(),
            # fingerprint_template is fake placeholder (do NOT use real data)
            "fingerprint_template": generate_dummy_fingerprint_blob(200),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S")
        }
        records.append(rec)
    return records

def write_json(drive: str, filename: str, records):
    path = os.path.join(f"{drive}\\", filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    return path

def write_csv(drive: str, filename: str, records):
    path = os.path.join(f"{drive}\\", filename)
    # Determine headers
    headers = list(records[0].keys()) if records else []
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for r in records:
            writer.writerow(r)
    return path

def main():
    ensure_windows()

    parser = argparse.ArgumentParser(description="Write dummy student CNIC + fingerprint data to USB (Windows).")
    parser.add_argument("--drive", help="Drive letter or path (e.g., E or E:). If omitted, auto-detects first removable drive.")
    parser.add_argument("--format", choices=["json", "csv"], default="json", help="Output format")
    parser.add_argument("--count", type=int, default=5, help="Number of dummy records to generate")
    parser.add_argument("--filename", help="Filename to write (default: students_dummy.{json|csv})")
    args = parser.parse_args()

    drive = None
    if args.drive:
        drive = normalize_drive_param(args.drive)
        if not os.path.exists(f"{drive}\\"):
            log.error("Specified drive does not exist or is not accessible: %s", drive)
            sys.exit(2)
    else:
        log.info("Auto-detecting removable drives...")
        detected = find_first_removable_drive()
        if not detected:
            log.error("No removable USB drive detected. Plug a USB drive and try again.")
            sys.exit(3)
        drive = detected.rstrip("\\")
        log.info("Using detected drive: %s", drive)

    # Build dummy data
    records = build_dummy_records(args.count)
    filename = args.filename or f"students_dummy.{args.format}"

    try:
        if args.format == "json":
            out_path = write_json(drive, filename, records)
        else:
            out_path = write_csv(drive, filename, records)
        log.info("Wrote %d records to %s", len(records), out_path)
        print(f"SUCCESS: Written file -> {out_path}")
    except PermissionError as e:
        log.error("Permission denied writing to drive %s: %s", drive, e)
        log.error("Make sure the drive is not write-protected and you have permissions.")
        sys.exit(4)
    except Exception as e:
        log.exception("Failed to write to USB: %s", e)
        sys.exit(5)
    finally:
        # ensure COM cleanup
        gc.collect()
        co_uninitialize()

if __name__ == "__main__":
    main()
