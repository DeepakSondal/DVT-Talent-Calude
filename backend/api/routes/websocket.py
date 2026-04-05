import json
import asyncio
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import List, Dict
from jose import JWTError, jwt
from config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id → ws
        self.redis_client = redis.from_url(settings.redis_url)
        self.pubsub_task = None

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        # Start Redis listener if not running
        if self.pubsub_task is None:
            self.pubsub_task = asyncio.create_task(self._redis_listener())

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def _redis_listener(self):
        """Background task to listen for AI signals from Celery workers"""
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe("dvt_signals")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await self.broadcast(data)
                    except Exception:
                        pass
        except Exception:
            self.pubsub_task = None

    async def send_to_user(self, user_id: str, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, message: dict):
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


@router.websocket("/pipeline-events")
async def pipeline_events_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    Dedicated endpoint for real-time AI pipeline activity notifications.
    Used by the dashboard 'Live Feed' component.
    """
    user_id = _verify_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(user_id)
