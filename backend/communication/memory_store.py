"""
DVT Talent AI — Shared Memory Store
Distributed state management for agents using Redis.
"""
import json
import redis.asyncio as redis
from typing import Optional, Any, Dict
from config import settings

class SharedMemory:
    """
    Provides a shared memory layer for agents to store transactional state.
    Uses Redis Hashes for structured entity data.
    """
    def __init__(self, redis_url: str = settings.redis_url):
        self.client = redis.from_url(redis_url, decode_responses=True)

    async def set(self, key: str, value: Dict[str, Any], ttl: int = 3600) -> bool:
        """ Store a dictionary as a JSON string with an optional TTL """
        try:
            await self.client.set(key, json.dumps(value), ex=ttl)
            return True
        except Exception:
            return False

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """ Retrieve a JSON string and parse it back to a dictionary """
        data = await self.client.get(key)
        if data:
            return json.loads(data)
        return None

    async def delete(self, key: str) -> bool:
        """ Remove a key from memory """
        return await self.client.delete(key) > 0

    async def exists(self, key: str) -> bool:
        """ Check if a key exists in memory """
        return await self.client.exists(key) > 0

    async def close(self):
        """ Close the redis connection """
        await self.client.close()
