import time
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import redis.asyncio as redis
from config import settings
import structlog

log = structlog.get_logger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._redis = None

    async def get_redis(self):
        if self._redis is None:
            self._redis = redis.from_url(settings.redis_url)
        return self._redis

    async def dispatch(self, request: Request, call_next):
        # 1. Identify Client (User ID or IP)
        user = getattr(request.state, "user", None)
        client_id = f"rl:user:{user.id}" if user else f"rl:ip:{request.client.host if request.client else 'unknown'}"
        
        # 2. Check Rate Limit in Redis
        r = await self.get_redis()
        current_minute = int(time.time() / 60)
        key = f"{client_id}:{current_minute}"
        
        try:
            count = await r.incr(key)
            if count == 1:
                await r.expire(key, 60) # Cleanup after 1 minute

            if count > self.requests_per_minute:
                log.warning("rate_limit_exceeded", client=client_id, count=count)
                return Response(
                    content=json.dumps({"error": "Rate limit exceeded. Try again in a minute."}),
                    status_code=HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json"
                )
        except Exception as e:
            # Don't fail the request if Redis is down, just log
            log.error("rate_limit_redis_failed", error=str(e))
        
        return await call_next(request)
