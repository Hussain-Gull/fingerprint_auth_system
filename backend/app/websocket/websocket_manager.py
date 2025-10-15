"""
WebSocket Manager for Real-time Communication
Handles fingerprint capture events, device status updates, and enrollment progress
"""

import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.fingerprint_service import capture_fingerprint_with_retry
from backend.app.secugen_binding import SecuGen

log = logging.getLogger("websocket_manager")

class ConnectionManager:
    def __init__(self):
        # Store active connections by type
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "enrollment": set(),
            "admin": set(),
            "status": set()
        }
        
    async def connect(self, websocket: WebSocket, connection_type: str):
        await websocket.accept()
        self.active_connections[connection_type].add(websocket)
        log.info(f"WebSocket connected for {connection_type}. Total connections: {len(self.active_connections[connection_type])}")
        
    def disconnect(self, websocket: WebSocket, connection_type: str):
        self.active_connections[connection_type].discard(websocket)
        log.info(f"WebSocket disconnected for {connection_type}. Remaining connections: {len(self.active_connections[connection_type])}")
        
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            log.error(f"Failed to send personal message: {e}")
            
    async def broadcast_to_type(self, message: dict, connection_type: str):
        """Broadcast message to all connections of a specific type"""
        if connection_type not in self.active_connections:
            return
            
        disconnected = set()
        for connection in self.active_connections[connection_type]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                log.error(f"Failed to broadcast to {connection_type}: {e}")
                disconnected.add(connection)
                
        # Clean up disconnected connections
        for conn in disconnected:
            self.active_connections[connection_type].discard(conn)
            
    async def broadcast_status_update(self, status_data: dict):
        """Broadcast device status updates to admin and status connections"""
        message = {
            "type": "status_update",
            "data": status_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast_to_type(message, "admin")
        await self.broadcast_to_type(message, "status")

# Global connection manager instance
manager = ConnectionManager()

async def handle_fingerprint_capture(websocket: WebSocket, connection_type: str):
    """Handle the real-time fingerprint capture process"""
    await manager.connect(websocket, connection_type)
    
    try:
        while True:
            # Wait for a capture request from a client
            data = await websocket.receive_text()
            request = json.loads(data)
            
            if request.get("action") == "start_capture":
                await manager.send_personal_message({
                    "type": "capture_started",
                    "message": "Starting fingerprint capture..."
                }, websocket)
                
                # Perform fingerprint capture with retries
                success, template = capture_fingerprint_with_retry()
                
                if success:
                    await manager.send_personal_message({
                        "type": "capture_success",
                        "message": "Fingerprint captured successfully",
                        "template_length": len(template) if template else 0
                    }, websocket)
                else:
                    await manager.send_personal_message({
                        "type": "capture_failed",
                        "message": "Fingerprint capture failed. Please try again.",
                        "reason": "device_unavailable"
                    }, websocket)
                    
            elif request.get("action") == "get_status":
                # Send current device status
                device_status = {
                    "secugen_connected": SecuGen.is_connected(),
                    "device_info": SecuGen.get_device_info()
                }
                await manager.send_personal_message({
                    "type": "device_status",
                    "data": device_status
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, connection_type)
    except Exception as e:
        log.error(f"WebSocket error in fingerprint capture: {e}")
        manager.disconnect(websocket, connection_type)

async def handle_enrollment_websocket(websocket: WebSocket):
    """Handle the enrollment process with real-time updates"""
    await handle_fingerprint_capture(websocket, "enrollment")


async def handle_admin_websocket(websocket: WebSocket):
    """Handle admin dashboard real-time updates"""
    await manager.connect(websocket, "admin")
    
    try:
        while True:
            # Send periodic status updates
            await asyncio.sleep(5)  # Update every 5 seconds
            
            status_data = {
                "secugen_connected": SecuGen.is_connected(),
                "device_info": SecuGen.get_device_info(),
                "active_connections": {
                    conn_type: len(conns) 
                    for conn_type, conns in manager.active_connections.items()
                }
            }
            
            await manager.send_personal_message({
                "type": "status_update",
                "data": status_data
            }, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, "admin")
    except Exception as e:
        log.error(f"WebSocket error in admin dashboard: {e}")
        manager.disconnect(websocket, "admin")
