"""
DVT Talent AI — Base Agent (FIXED)
Fixes applied:
  [C-05] Sync OpenAI client blocked async loop → added AsyncOpenAI + chat_async()
  [M-02] Removed unused `asyncio` import
  [M-01] Guard against missing API key before calling LLM
  [M-07] search_web guards against missing SERPER_API_KEY
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional
import structlog
from openai import OpenAI, AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings

log = structlog.get_logger()


class BaseAgent(ABC):
    """
    Base class for all DVT Talent AI autonomous agents.
    Provides shared LLM access, memory, logging, and error handling.
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.log = log.bind(agent=name)
        self._llm_client: Optional[OpenAI] = None
        self._async_llm_client: Optional[AsyncOpenAI] = None
        self._results: Dict[str, Any] = {}
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None

    @property
    def llm(self) -> OpenAI:
        """Lazy-init synchronous LLM client — safe for Celery workers."""
        if self._llm_client is None:
            self._llm_client = OpenAI(
                api_key=settings.primary_llm_api_key,
                base_url=settings.primary_llm_base_url,
            )
        return self._llm_client

    @property
    def async_llm(self) -> AsyncOpenAI:
        """Lazy-init async LLM client — use from FastAPI async endpoints."""
        if self._async_llm_client is None:
            self._async_llm_client = AsyncOpenAI(
                api_key=settings.primary_llm_api_key,
                base_url=settings.primary_llm_base_url,
            )
        return self._async_llm_client

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> str:
        """Synchronous LLM call with retry — safe for Celery/sync contexts."""
        if not settings.primary_llm_api_key:
            raise RuntimeError(
                "No LLM API key configured. Set KIMI_API_KEY, DEEPSEEK_API_KEY, "
                "or OPENAI_API_KEY in backend/.env"
            )
        kwargs: Dict[str, Any] = {
            "model": settings.primary_llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = self.llm.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    async def chat_async(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> str:
        """
        Async LLM call — ALWAYS use this from FastAPI async route handlers.
        Using the sync `chat()` from an async endpoint blocks the event loop
        and causes timeouts under load.
        """
        if not settings.primary_llm_api_key:
            raise RuntimeError(
                "No LLM API key configured. Set KIMI_API_KEY, DEEPSEEK_API_KEY, "
                "or OPENAI_API_KEY in backend/.env"
            )
        kwargs: Dict[str, Any] = {
            "model": settings.primary_llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = await self.async_llm.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def search_web(self, query: str, num_results: int = 10) -> list:
        """Search the web using Serper API. Returns [] if key not configured."""
        if not settings.serper_api_key:
            self.log.warning("serper_key_missing", msg="Web search skipped — set SERPER_API_KEY")
            return []
        import httpx
        headers = {
            "X-API-KEY": settings.serper_api_key,
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=30) as client:
            response = client.post(
                "https://google.serper.dev/search",
                headers=headers,
                json={"q": query, "num": num_results},
            )
            response.raise_for_status()
            return response.json().get("organic", [])

    def log_start(self, task_description: str):
        self.started_at = datetime.utcnow()
        self.log.info("agent_task_started", task=task_description)

    def log_complete(self, results_summary: str):
        self.completed_at = datetime.utcnow()
        duration = (
            (self.completed_at - self.started_at).total_seconds()
            if self.started_at else 0
        )
        self.log.info("agent_task_completed", summary=results_summary, duration_seconds=round(duration, 2))

    def log_error(self, error: Exception):
        self.log.error("agent_task_failed", error=str(error), exc_info=True)

    @abstractmethod
    def run(self, **kwargs) -> Dict[str, Any]:
        """Execute the agent's main task. Must be implemented by subclasses."""
        pass
