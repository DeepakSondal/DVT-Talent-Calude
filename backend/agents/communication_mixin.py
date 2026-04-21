import structlog
from typing import Any, Dict, Optional
from communication.memory_store import SharedMemory
from communication.event_bus import EventBus

log = structlog.get_logger()

class CommunicationMixin:
    """
    Mixin that provides agents with messaging and memory capabilities.
    Includes robust error handling for Redis-backed services.
    """
    def __init__(self, agent_name: str, memory: SharedMemory = None, event_bus: EventBus = None):
        self.agent_name = agent_name
        self.memory = memory
        self.event_bus = event_bus
        # Agents can declare what events they want to listen to
        self.interested_events = []
        self.comm_log = log.bind(agent=agent_name, module="communication")

    async def emit(self, event_type: str, data: Dict[str, Any], channel: str = "agent.discovery"):
        """ Publish an event as this agent """
        if self.event_bus:
            try:
                await self.event_bus.publish(channel, event_type, data, source=self.agent_name)
            except Exception as e:
                self.comm_log.error("event_publish_failed", event=event_type, error=str(e))
        else:
            self.comm_log.debug("event_bus_not_available", event=event_type)

    async def remember(self, key: str, value: Dict[str, Any], ttl: int = 3600):
        """ Store state in shared memory """
        if self.memory:
            try:
                await self.memory.set(key, value, ttl=ttl)
            except Exception as e:
                self.comm_log.error("memory_store_failed", key=key, error=str(e))
        else:
             self.comm_log.debug("shared_memory_not_available", key=key)

    async def recall(self, key: str) -> Optional[Dict[str, Any]]:
        """ Recall state from shared memory """
        if self.memory:
            try:
                return await self.memory.get(key)
            except Exception as e:
                self.comm_log.error("memory_recall_failed", key=key, error=str(e))
        return None

    async def on_event(self, event_type: str, data: Dict[str, Any]):
        """ 
        Hook for agents to handle incoming events. 
        Override in child agents.
        """
        pass
