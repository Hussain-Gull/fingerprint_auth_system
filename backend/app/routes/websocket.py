"""
WebSocket Routes for Real-time Communication
"""

from fastapi import APIRouter, WebSocket
from backend.app.websocket.websocket_manager import (
    handle_enrollment_websocket,
    handle_admin_websocket
)

router = APIRouter()

@router.websocket("/enrollment")
async def websocket_enrollment(websocket: WebSocket):
    """WebSocket endpoint for enrollment process"""
    await handle_enrollment_websocket(websocket)

@router.websocket("/admin")
async def websocket_admin(websocket: WebSocket):
    """WebSocket endpoint for admin dashboard"""
    await handle_admin_websocket(websocket)
