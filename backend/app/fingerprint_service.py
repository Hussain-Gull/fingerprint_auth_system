import logging
from .secugen_binding import SecuGen
from time import sleep
from typing import Tuple

log = logging.getLogger("fingerprint_service")

def ensure_device_connected(retries=3, backoff=0.5) -> bool:
    if SecuGen.is_connected():
        return True
    for i in range(retries):
        ok = SecuGen.connect()
        if ok:
            log.info("SecuGen device connected on attempt %d", i+1)
            return True
        sleep(backoff * (i+1))
    log.error("SecuGen device unavailable after %d retries", retries)
    return False

def capture_fingerprint_with_retry(max_attempts=3) -> Tuple[bool, bytes]:
    attempts = 0
    while attempts < max_attempts:
        attempts += 1
        if not ensure_device_connected():
            log.warning("Device not available for capture (attempt %d)", attempts)
            return False, b""
        ok, template = SecuGen.capture_template()
        if ok and template:
            log.info("Captured fingerprint template (len=%d) on attempt %d", len(template), attempts)
            return True, template
        log.warning("Capture failed attempt %d; retrying", attempts)
    log.error("Fingerprint capture failed after %d attempts", max_attempts)
    return False, b""
