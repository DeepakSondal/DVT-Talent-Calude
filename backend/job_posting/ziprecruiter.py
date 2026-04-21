"""
DVT Talent AI — ZipRecruiter Job Distribution
Handles automated job postings to ZipRecruiter via the Partner API.
"""
import httpx
import structlog
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential

log = structlog.get_logger(__name__)

class ZipRecruiterClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.ziprecruiter.com/partner/v0/job"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )
    async def post_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Post a job to ZipRecruiter Partner API.
        Reference: https://www.ziprecruiter.com/api/v1/docs
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url,
                    auth=(self.api_key, ""), # Basic Auth: API_KEY as username, empty password
                    json=job_data,
                    timeout=30.0
                )
                response.raise_for_status()
                log.info("ziprecruiter_post_success", job_id=job_data.get("external_id"))
                return response.json()
            except httpx.HTTPStatusError as e:
                log.error("ziprecruiter_api_error", status=e.response.status_code, body=e.response.text)
                raise
            except Exception as e:
                log.error("ziprecruiter_connection_failed", error=str(e))
                raise

async def post_job_to_ziprecruiter(job_data: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """ Convenience wrapper with retry logic for the Orchestrator/Agents """
    client = ZipRecruiterClient(api_key)
    return await client.post_job(job_data)
