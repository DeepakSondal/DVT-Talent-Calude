"""
DVT Talent AI — Event Bus
Redis Pub/Sub implementation for event-driven agent coordination.
"""
import json
import asyncio
import structlog
from typing import Callable, Dict, List, Any
import redis.asyncio as redis
from config import settings
from datetime import datetime

log = structlog.get_logger(__name__)

class EventBus:
    """
    Handles internal events across the agent swarm.
    """
    def __init__(self, redis_url: str = settings.redis_url):
        self.redis_url = redis_url
        self.client = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.client.pubsub()
        self.subscriptions: Dict[str, List[Callable]] = {}
        self._listener_task = None

    async def publish(self, channel: str, event_type: str, data: Dict[str, Any], source: str = "system"):
        """ Publish an event to a specific channel """
        event = {
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
            "source_agent": source
        }
        await self.client.publish(channel, json.dumps(event))
        log.info("event_published", channel=channel, type=event_type, source=source)

    async def subscribe(self, channel: str, callback: Callable):
        """ Subscribe a callback to a channel """
        if channel not in self.subscriptions:
            self.subscriptions[channel] = []
            await self.pubsub.subscribe(channel)
        
        self.subscriptions[channel].append(callback)
        
        # Start listener loop if not running
        if self._listener_task is None:
            self._listener_task = asyncio.create_task(self._listen_loop())
        
        log.info("event_subscribed", channel=channel)

    async def _listen_loop(self):
        """ Internal loop to process incoming messages from Pub/Sub """
        try:
            while True:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True)
                if message:
                    channel = message["channel"]
                    data = json.loads(message["data"])
                    
                    if channel in self.subscriptions:
                        # Non-blocking execution of callbacks
                        for callback in self.subscriptions[channel]:
                            asyncio.create_task(callback(data.get("event_type"), data.get("data")))
                
                await asyncio.sleep(0.01) # Small sleep to prevent CPU pegging
        except Exception as e:
            log.error("event_bus_error", error=str(e))

    async def close(self):
        """ Cleanup resources """
        if self._listener_task:
            self._listener_task.cancel()
        await self.pubsub.unsubscribe()
        await self.client.close()
