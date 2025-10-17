import asyncio
import secrets
import contextlib
from datetime import datetime, timedelta
from app.core.config import settings
from app.services.secu_gen import SecuGenDevice
from app.utils.logger import logger


class ScanSession:
    """
    Fingerprint scan session that interacts with the SecuGen device.
    
    Process Flow:
    1. Initialize device and open connection
    2. Configure device settings (brightness, template format)
    3. Blink LED to indicate readiness
    4. Capture fingerprint IMAGE with quality checking
    5. Verify image quality
    6. Create TEMPLATE from captured image
    7. Return template for storage/matching
    
    Keeps the WebSocket alive through errors and only terminates when:
      - a valid fingerprint template is created, or
      - session times out, or
      - WebSocket manually closes.
    """

    def __init__(self, identity_number: str, full_name: str, timeout_seconds: int = None):
        self.identity_number = identity_number
        self.full_name = full_name
        self.token = secrets.token_urlsafe(32)
        self.expires_at = datetime.utcnow() + timedelta(seconds=timeout_seconds or settings.SCAN_SESSION_TIMEOUT)
        self.active = True
        self.device = None
        self._blink_task = None
        self._capture_attempts = 0
        self._max_attempts = 3

    async def run_scan(self, send_event_callable):
        """
        Main scan workflow:
        1. Initialize device
        2. Capture fingerprint IMAGE
        3. Verify image quality
        4. Create TEMPLATE from image
        5. Return template
        """
        try:
            # Step 1: Initialize device
            logger.info("Initializing SecuGen device for session %s", self.token)
            self.device = SecuGenDevice()
            
            await asyncio.get_event_loop().run_in_executor(None, self.device.create)
            logger.debug("Device object created")
            
            await asyncio.get_event_loop().run_in_executor(None, self.device.init)
            logger.debug("Device initialized")
            
            await asyncio.get_event_loop().run_in_executor(None, self.device.open, 0)
            logger.info("Device connected for session %s", self.token)

            # Step 2: Configure device
            await self._configure_device(send_event_callable)

            # Step 3: Get device info for image dimensions
            device_info = await asyncio.get_event_loop().run_in_executor(
                None, self.device.get_device_info
            )
            width = device_info.get('width', 300)
            height = device_info.get('height', 400)
            logger.info("Device image size: %dx%d", width, height)

            # Step 4: Blink LED twice to indicate readiness
            await asyncio.get_event_loop().run_in_executor(None, self.device.blink_led, 2, 0.3)
            await send_event_callable({
                "type": "device_ready",
                "message": "Device is ready. Please place your thumb firmly on the scanner."
            })

            # Step 5: Capture fingerprint IMAGE with retries
            img_buffer = await self._capture_image_with_retry(send_event_callable, width, height)
            
            if img_buffer is None:
                await send_event_callable({
                    "type": "error",
                    "message": "Failed to capture fingerprint after multiple attempts."
                })
                return None

            # Step 6: Verify image quality
            quality_score = await self._verify_image_quality(img_buffer, width, height, send_event_callable)
            
            if quality_score < 40:
                logger.warning("Image quality too low: %d", quality_score)
                await send_event_callable({
                    "type": "warning",
                    "message": f"Image quality low ({quality_score}). Please try again with a cleaner, drier finger."
                })
                # Allow continuation but warn user
            else:
                logger.info("Image quality acceptable: %d", quality_score)

            # Step 7: Create TEMPLATE from captured image
            await send_event_callable({
                "type": "processing",
                "message": "Processing fingerprint..."
            })

            template = await asyncio.get_event_loop().run_in_executor(
                None, 
                self.device.create_template, 
                img_buffer,
                quality_score
            )

            if template is None:
                logger.error("Template creation failed")
                await send_event_callable({
                    "type": "error",
                    "message": "Failed to create fingerprint template. Please try again."
                })
                return None

            logger.info("Fingerprint template created successfully. Template size: %d bytes", len(template))
            
            await send_event_callable({
                "type": "capture_success",
                "message": f"Fingerprint scan successful! Quality: {quality_score}/100",
                "quality": quality_score,
                "template_size": len(template)
            })

            return template

        except Exception as e:
            logger.exception("Error in run_scan: %s", e)
            await send_event_callable({
                "type": "error",
                "message": f"Scan error: {str(e)}"
            })
            return None

        finally:
            # Ensure device is properly closed
            await self._cleanup_device()

    async def _configure_device(self, send_event_callable):
        """
        Configure device settings for optimal capture.
        """
        try:
            logger.debug("Configuring device settings...")
            
            # Set brightness to optimal level (50)
            await asyncio.get_event_loop().run_in_executor(
                None, self.device.set_brightness, 50
            )
            logger.debug("Brightness set to 50")

            # Set template format to SG400 (default)
            await asyncio.get_event_loop().run_in_executor(
                None, self.device.set_template_format
            )
            logger.debug("Template format configured")

            await send_event_callable({
                "type": "device_configured",
                "message": "Device configured successfully."
            })

        except Exception as e:
            logger.warning("Device configuration error (non-fatal): %s", e)
            # Continue even if configuration fails

    async def _capture_image_with_retry(self, send_event_callable, width, height, max_attempts=3):
        """
        Attempt to capture fingerprint IMAGE with retries.
        
        Args:
            send_event_callable: Function to send WebSocket events
            width: Image width in pixels
            height: Image height in pixels
            max_attempts: Maximum number of capture attempts
            
        Returns:
            bytes: Raw image buffer if successful, None otherwise
        """
        timeout_ms = 15000  # 15 seconds per attempt
        quality_threshold = 30  # Lower threshold for initial capture
        
        for attempt in range(1, max_attempts + 1):
            self._capture_attempts = attempt
            
            logger.info("Capture attempt %d/%d", attempt, max_attempts)
            await send_event_callable({
                "type": "capture_attempt",
                "message": f"Attempt {attempt}/{max_attempts}: Place your finger firmly on the sensor.",
                "attempt": attempt,
                "max_attempts": max_attempts
            })

            try:
                # Capture image using GetImageEx with quality checking
                img_buffer = await asyncio.get_event_loop().run_in_executor(
                    None,
                    self.device.capture_image_ex,
                    timeout_ms,
                    quality_threshold
                )

                if img_buffer is not None and len(img_buffer) == width * height:
                    logger.info("Image captured successfully on attempt %d", attempt)
                    await send_event_callable({
                        "type": "image_captured",
                        "message": "Fingerprint image captured successfully!"
                    })
                    return img_buffer
                else:
                    logger.warning("Invalid image buffer received")
                    
            except TimeoutError:
                logger.warning("Capture timeout on attempt %d", attempt)
                await send_event_callable({
                    "type": "timeout",
                    "message": f"Timeout on attempt {attempt}. Please try again."
                })
                
            except Exception as e:
                logger.warning("Capture error on attempt %d: %s", attempt, e)
                await send_event_callable({
                    "type": "capture_error",
                    "message": f"Capture failed: {str(e)}"
                })

            # Wait before retry (except on last attempt)
            if attempt < max_attempts:
                await asyncio.sleep(1)
                await send_event_callable({
                    "type": "retry",
                    "message": "Retrying... Ensure finger is clean, dry, and covers the entire sensor."
                })

        # All attempts failed
        logger.error("Failed to capture image after %d attempts", max_attempts)
        return None

    async def _verify_image_quality(self, img_buffer, width, height, send_event_callable):
        """
        Verify the quality of captured fingerprint image.
        
        Args:
            img_buffer: Raw image bytes
            width: Image width
            height: Image height
            send_event_callable: Function to send WebSocket events
            
        Returns:
            int: Quality score (0-100)
        """
        try:
            logger.debug("Verifying image quality...")
            
            quality_score = await asyncio.get_event_loop().run_in_executor(
                None,
                self.device.get_image_quality,
                img_buffer,
                width,
                height
            )

            logger.info("Image quality score: %d/100", quality_score)
            
            # Determine quality level
            if quality_score >= 70:
                quality_level = "EXCELLENT"
                quality_msg = "Image quality is excellent for registration."
            elif quality_score >= 50:
                quality_level = "GOOD"
                quality_msg = "Image quality is good."
            elif quality_score >= 40:
                quality_level = "ACCEPTABLE"
                quality_msg = "Image quality is acceptable for verification."
            else:
                quality_level = "LOW"
                quality_msg = "Image quality is low. Consider recapturing."

            await send_event_callable({
                "type": "quality_check",
                "message": quality_msg,
                "quality_score": quality_score,
                "quality_level": quality_level
            })

            return quality_score

        except Exception as e:
            logger.warning("Quality verification failed: %s", e)
            # Return default score if verification fails
            return 50

    async def _cleanup_device(self):
        """
        Cleanup device resources.
        """
        try:
            if self.device:
                logger.debug("Cleaning up device...")
                
                # Stop any LED blinking
                await self._stop_led(asyncio.get_event_loop())
                
                # Close device
                await asyncio.get_event_loop().run_in_executor(
                    None, self.device.close
                )
                
                # Terminate device object
                await asyncio.get_event_loop().run_in_executor(
                    None, self.device.terminate
                )
                
                logger.info("Device cleanup completed")
                
        except Exception as e:
            logger.warning("Error during device cleanup: %s", e)

    # ------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------
    async def _blink_led_background(self):
        """
        Runs LED blinking in background thread.
        Automatically stops if cancelled or an exception occurs.
        """
        loop = asyncio.get_running_loop()
        try:
            logger.debug("Starting LED blink thread.")
            await loop.run_in_executor(None, self.device.blink_led, 20, 0.4)
        except asyncio.CancelledError:
            # Expected when finger detected or session ends
            logger.debug("LED blink task cancelled (finger detected).")
            await loop.run_in_executor(None, self.device.set_led, False)
        except Exception as e:
            logger.warning("LED blink encountered error: %s", e)
            await loop.run_in_executor(None, self.device.set_led, False)

    async def _stop_led(self, loop):
        """
        Cancels LED blink task (if running) and ensures LED is turned off.
        """
        try:
            if self._blink_task and not self._blink_task.done():
                self._blink_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await self._blink_task
            await loop.run_in_executor(None, self.device.set_led, False)
            logger.debug("LED manually turned off.")
        except Exception as e:
            logger.warning("Failed to stop LED cleanly: %s", e)

    def is_expired(self):
        """Check if session has expired."""
        return datetime.utcnow() > self.expires_at

    async def cancel(self):
        """Cancel the scan session."""
        logger.info("Cancelling scan session %s", self.token)
        self.active = False
        await self._cleanup_device()
