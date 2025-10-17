import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.fingerprint_session import ScanSession
from app.db.db import database
from app.models import models
from app.services.crypto import encrypt_bytes
from app.utils.logger import logger

router = APIRouter()


@router.websocket("/ws/scan/{identity_number}")
async def ws_scan(ws: WebSocket, identity_number: str):
    """
    WebSocket endpoint for fingerprint scanning.

    Flow:
    1️⃣ Client connects to /ws/scan/{identity_number}
    2️⃣ Backend verifies student exists
    3️⃣ Device connects and starts blinking
    4️⃣ User places finger → capture success
    5️⃣ Fingerprint encrypted and saved
    6️⃣ WebSocket closes normally
    """
    await ws.accept()
    logger.info("WebSocket connected for identity %s", identity_number)

    async def send_event(payload: dict):
        """Helper to safely send JSON messages to the frontend."""
        try:
            await ws.send_text(json.dumps(payload))
        except RuntimeError:
            # Happens if the client disconnects mid-send
            logger.warning("WebSocket send attempted on closed socket.")
        except Exception as e:
            logger.warning("Failed to send WS event: %s", e)

    session = None

    try:
        # --- Step 1: Verify student record ---
        query = models.applications.select().where(models.applications.c.identity_number == identity_number)
        rec = await database.fetch_one(query)
        if not rec:
            await send_event({
                "type": "error",
                "message": f"No student found for CNIC {identity_number}."
            })
            await ws.close(code=4000)
            return

        # --- Step 2: Start scan session ---
        session = ScanSession(identity_number, rec["full_name"])
        await send_event({
            "type": "device_init",
            "message": "Initializing fingerprint scanner..."
        })

        # Run scan in parallel to allow detecting disconnects
        scan_task = asyncio.create_task(session.run_scan(send_event))
        
        # Create a task to monitor client disconnection
        disconnect_task = asyncio.create_task(ws.receive_text())

        # Monitor both: scan process + client connection
        done, pending = await asyncio.wait(
            {scan_task, disconnect_task},
            return_when=asyncio.FIRST_COMPLETED
        )

        if disconnect_task in done:
            # Client disconnected or sent cancel signal
            logger.warning("Client disconnected or cancelled scan for %s", identity_number)
            if not scan_task.done():
                scan_task.cancel()
            # Cancel any pending tasks
            for task in pending:
                task.cancel()
            await ws.close(code=1001)
            return

        # Cancel the disconnect monitoring task since scan completed
        disconnect_task.cancel()
        
        # Await scan result
        template = await scan_task

        # --- Step 3: Handle capture failure ---
        if template is None:
            await send_event({
                "type": "capture_failed",
                "message": "No valid fingerprint captured. Please retry or restart the scan."
            })
            return  # keep socket open, frontend decides next step

        # --- Step 4: Encrypt + save ---
        try:
            enc = encrypt_bytes(template)
            upd = (
                models.applications
                .update()
                .where(models.applications.c.identity_number == identity_number)
                .values(fingerprint_encrypted=enc)
            )
            await database.execute(upd)
            logger.info("Encrypted fingerprint saved for %s", identity_number)
        except Exception as e:
            logger.exception("Failed to encrypt/save fingerprint: %s", e)
            await send_event({
                "type": "error",
                "message": f"Failed to store fingerprint: {str(e)}"
            })
            return

        # --- Step 5: Success ---
        await send_event({
            "type": "capture_success",
            "message": "Fingerprint captured and saved securely."
        })
        await send_event({
            "type": "done",
            "message": "Scan completed successfully."
        })
        await ws.close(code=1000)
        logger.info("WebSocket closed normally for %s", identity_number)

    except WebSocketDisconnect:
        logger.warning("WebSocket disconnected during scan for %s", identity_number)
        if session:
            session.device.stop_blink()

    except asyncio.CancelledError:
        logger.warning("Scan task cancelled for %s", identity_number)
        if session:
            session.device.stop_blink()

    except Exception as e:
        logger.exception("Unhandled exception in ws_scan: %s", e)
        try:
            await send_event({
                "type": "error",
                "message": f"Unexpected error: {str(e)}"
            })
        finally:
            await ws.close(code=1011)
