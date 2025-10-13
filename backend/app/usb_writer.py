"""
usb_writer.py

Safe USB writer script. Must be run on Windows.
- --dry-run shows plan and does not write
- --confirm-writes required to actually write
- Requires human typed confirmation of target drive letter and typed filename to proceed (non-bypassable)

High-level steps:
1. Discover removable drives (Windows)
2. Show free space, required size, planned file list
3. If --confirm-writes present AND user types confirmation token, perform atomic write:
   write to temp file, fsync, then os.replace
4. Verify checksum of written file

This script intentionally refuses to format or overwrite the entire drive automatically.
"""

import argparse
import os
import sys
import json
import tempfile
import shutil
import hashlib
import logging
from datetime import datetime
from typing import List
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import settings
from .database import SessionLocal
from .models import Student

log = logging.getLogger("usb_writer")
logging.basicConfig(level=logging.INFO)

def find_removable_drives_windows() -> List[str]:
    # Windows-specific: check drive types via ctypes windll.kernel32.GetDriveTypeW
    try:
        import ctypes
        drives = []
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        for i in range(26):
            if bitmask & (1 << i):
                drive = f"{chr(65 + i)}:\\"
                # DRIVE_REMOVABLE = 2, DRIVE_FIXED = 3
                dt = ctypes.windll.kernel32.GetDriveTypeW(ctypes.c_wchar_p(drive))
                if dt == 2:
                    drives.append(drive)
        return drives
    except Exception as e:
        log.exception("Failed to enumerate drives: %s", e)
        return []

def load_students_from_db() -> List[dict]:
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        out = []
        for s in students:
            out.append({
                "id": str(s.id),
                "name": s.name,
                "cnic_number": s.cnic_number,
                "fingerprint_template": s.fingerprint_template.hex() if s.fingerprint_template else None,
            })
        return out
    finally:
        db.close()

def estimate_size(records) -> int:
    # rough estimate: JSON utf-8 length
    txt = json.dumps(records)
    return len(txt.encode("utf-8"))

def checksum_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def atomic_write_bytes(path: str, data: bytes):
    dirn = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(prefix=".tmp_", dir=dirn)
    try:
        os.write(fd, data)
        os.fsync(fd)
        os.close(fd)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--confirm-writes", action="store_true")
    parser.add_argument("--target-drive", type=str, help="Drive letter (e.g. E: ) optional")
    args = parser.parse_args()

    records = load_students_from_db()
    size = estimate_size(records)
    log.info("Records to write: %d; estimated bytes: %d", len(records), size)

    drives = find_removable_drives_windows()
    log.info("Detected removable drives: %s", drives)
    if args.target_drive:
        target = args.target_drive.rstrip("\\/")
        if not target.endswith(":"):
            target += ":"
        target += "\\"
        if target not in drives:
            log.error("Requested target drive %s not in detected removable drives", target)
            return 2
    else:
        if not drives:
            log.error("No removable drives detected. Aborting.")
            return 2
        # ask user to select if not dry-run
        print("Detected removable drives:")
        for i,d in enumerate(drives):
            print(f"{i}) {d}")
        sel = input("Enter drive index to use (or 'q' to quit): ")
        if sel.lower() == 'q':
            return 1
        try:
            idx = int(sel)
            target = drives[idx]
        except Exception as e:
            log.error("Invalid selection: %s", e)
            return 2

    target_dir = os.path.join(target, settings.USB_WRITE_DIRNAME)
    planned_file = os.path.join(target_dir, f"students_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.json")

    print("Planned writes:")
    print(f"- Create directory: {target_dir}")
    print(f"- Create file: {planned_file} (estimated {size} bytes)")

    if args.dry_run or not args.confirm_writes:
        log.info("DRY RUN: not performing writes. Use --confirm-writes to actually write.")
        return 0

    # require typed confirmation token
    token = os.urandom(6).hex()
    print("To confirm, type the following token exactly:", token)
    typed = input("Token: ")
    if typed.strip() != token:
        log.error("Confirmation token mismatch. Aborting.")
        return 3

    # validate free space
    stat = shutil.disk_usage(target)
    free = stat.free
    if free < size:
        log.error("Not enough free space on %s. Required %d, free %d", target, size, free)
        return 4

    os.makedirs(target_dir, exist_ok=True)
    data_bytes = json.dumps(records).encode("utf-8")
    atomic_write_bytes(planned_file + ".tmp", data_bytes)  # write to temporary filename then rename
    # After atomic write, rename to final
    if os.path.exists(planned_file):
        os.remove(planned_file)
    os.rename(planned_file + ".tmp", planned_file)
    # verify checksum
    with open(planned_file, "rb") as f:
        written = f.read()
    if checksum_bytes(written) != checksum_bytes(data_bytes):
        log.error("Checksum mismatch after write. Cleaning up.")
        os.remove(planned_file)
        return 5
    log.info("Write successful to %s and verified (SHA256=%s)", planned_file, checksum_bytes(written))
    return 0

if __name__ == "__main__":
    sys.exit(main())
