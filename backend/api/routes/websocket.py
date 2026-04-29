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
        self.active_connections: Dict[str, WebSocket] = {}   # user_id → ws
        self.user_tenants: Dict[str, str] = {}               # user_id → tenant_id
        self.redis_client = redis.from_url(settings.redis_url)
        self.pubsub_task = None

    async def connect(self, websocket: WebSocket, user_id: str, tenant_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_tenants[user_id] = tenant_id

        # Start Redis listener if not running
        if self.pubsub_task is None:
            self.pubsub_task = asyncio.create_task(self._redis_listener())

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        self.user_tenants.pop(user_id, None)

    async def _redis_listener(self):
        """Listen on ALL active tenant channels and route messages to the correct users."""
        pubsub = self.redis_client.pubsub()
        # Subscribe to a pattern: dvt_signals:* covers all tenants
        await pubsub.psubscribe("dvt_signals:*")
        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    try:
                        # Channel format: dvt_signals:{tenant_id}
                        channel: str = message["channel"].decode() if isinstance(message["channel"], bytes) else message["channel"]
                        tenant_id = channel.split(":", 1)[1] if ":" in channel else None
                        data = json.loads(message["data"])
                        # Only broadcast to users belonging to this tenant
                        await self.broadcast_to_tenant(data, tenant_id)
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

    async def broadcast_to_tenant(self, message: dict, tenant_id: str | None):
        """Send to all WebSocket users belonging to a specific tenant."""
        disconnected = []
        for uid, ws in self.active_connections.items():
            if tenant_id and self.user_tenants.get(uid) != tenant_id:
                continue  # Skip users from other tenants
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)

    async def broadcast(self, message: dict):
        """Broadcast to ALL connected users (use only for system-level events)."""
        disconnected = []
        for uid, ws in self.active_connections.items():
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)


manager = ConnectionManager()


def _verify_ws_token(token: str) -> tuple[str, str] | tuple[None, None]:
    """Validate JWT and return (user_id, tenant_id), or (None, None) if invalid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id", "")
        if not user_id or payload.get("type") != "access":
            return None, None
        return user_id, tenant_id
    except JWTError:
        return None, None


@router.websocket("/pipeline-events")
async def pipeline_events_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    Dedicated endpoint for real-time AI pipeline activity notifications.
    Used by the dashboard 'Live Feed' component.
    """
    user_id, tenant_id = _verify_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id, tenant_id or "")
    try:
        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(user_id)
