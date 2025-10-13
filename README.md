                                                                                         # Fingerprint Authentication System (FastAPI + SecuGen)

Short: A production-ready skeleton to enroll and authenticate students via SecuGen fingerprint readers, store templates in PostgreSQL, support USB dataset export/import, safe USB writing, and containerized services.

## What this is
- Backend: FastAPI (Python 3.11+) with SQLAlchemy and PostgreSQL.
- Frontend: React + TypeScript (CRA skeleton).
- SecuGen FDx SDK integration stub in `backend/app/secugen_binding.py`. Replace stub with real ctypes/WinDLL calls to `sgfplib.dll` per SDK manual. :contentReference[oaicite:9]{index=9}
- Safe `usb_writer.py` that enumerates removable drives and requires typed confirmation and `--confirm-writes` to perform writes.

## Key safety rules implemented
1. **USB writes are dry-run by default**. Must provide `--confirm-writes` and type a random token to proceed.
2. **No automatic formatting**. Formatting drives is blocked: you must manually format/prepare drives.
3. **No raw fingerprint images stored**. Only SDK-generated fingerprint templates (bytea) are stored in DB.
4. **Atomic writes & verification** for USB outputs (temp file + fsync + rename + SHA256 verify).
5. **Fallback to OTP/PIN** when device unavailable (code path present; implement OTP provider in production).

## How to run (Windows dev)
1. Install Python 3.11, pip, virtualenv.
2. Install Docker Desktop (optional for container mode).
3. Set environment variables (or copy `.env.example` to `.env`):
