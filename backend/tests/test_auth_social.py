import pytest
from httpx import AsyncClient
from starlette.middleware.sessions import SessionMiddleware
from backend.main import app

# Add session middleware for testing
app.add_middleware(SessionMiddleware, secret_key="test-secret")

@pytest.mark.asyncio
async def test_social_login_redirect():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/login/google")
        # Ensure it redirects to Google OAuth
        assert response.status_code == 302
        assert "accounts.google.com" in response.headers["location"]

@pytest.mark.asyncio
async def test_social_login_invalid_provider():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/login/invalid_provider")
        assert response.status_code == 400
        assert "Invalid provider" in response.json()["detail"]
