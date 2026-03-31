"""
DVT Talent AI — WebSocket (FIXED [H-02]: Added JWT authentication)
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import List, Dict
from jose import JWTError, jwt
from config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id → ws

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict):
        import json
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
        import json
        disconnected = []
        for uid, ws in self.active_connections.items():
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)


manager = ConnectionManager()


def _verify_ws_token(token: str) -> str | None:
    """Validate JWT and return user_id, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            return None
        return user_id
    except JWTError:
        return None


@router.websocket("/live")
async def websocket_endpoint(
    websocket: WebSocket,
    # FIX [H-02]: Token passed as query param (standard WS auth pattern)
    token: str = Query(..., description="JWT access token"),
):
    user_id = _verify_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        # Send initial connection confirmation
        await manager.send_to_user(user_id, {
            "type": "connected",
            "message": "Live feed active",
            "user_id": user_id,
        })
        while True:
            # Keep-alive: echo ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(user_id)
