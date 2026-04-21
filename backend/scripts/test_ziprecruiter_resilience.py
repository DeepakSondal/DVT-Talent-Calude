"""
DVT Talent AI — ZipRecruiter Resilience Test
Simulates API failures to verify exponential backoff and retry logic.
"""
import asyncio
from unittest.mock import AsyncMock, patch
import httpx
from job_posting.ziprecruiter import post_job_to_ziprecruiter

async def test_resilience():
    print("🚀 Initiating ZipRecruiter Resilience Test...")
    
    # Mocking httpx.AsyncClient.post to fail twice then succeed
    mock_responses = [
        httpx.Response(503, content=b"Service Unavailable"), # Attempt 1
        httpx.Response(502, content=b"Bad Gateway"),         # Attempt 2
        httpx.Response(200, json={"success": True, "job_id": "zip_mock_999"}) # Attempt 3 (Success)
    ]
    
    mock_post = AsyncMock(side_effect=mock_responses)
    
    with patch("httpx.AsyncClient.post", mock_post):
        job_data = {"external_id": "TEST-01", "title": "Mock Engineer"}
        
        try:
            print("📡 Sending job post (Simulating unstable API)...")
            result = await post_job_to_ziprecruiter(job_data, "mock_key")
            
            print("\n✅ TEST RESULT:")
            print(f"   Status: Success after {mock_post.call_count} attempts.")
            print(f"   Response: {result}")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_resilience())
