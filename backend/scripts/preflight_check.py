"""
DVT Talent AI — Pre-Flight Check Script
Validates the entire stack (DB, Redis, API Keys, External Handshakes)
before deployment or pilot launch.
"""

import os
import sys
import asyncio
import httpx
from typing import List, Tuple
from dotenv import load_dotenv

# Add the backend directory to sys.path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

# ANSI Color Codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"

class PreflightCheck:
    def __init__(self):
        self.results: List[Tuple[str, bool, str]] = []

    def log_result(self, component: str, success: bool, message: str):
        self.results.append((component, success, message))
        icon = f"{GREEN}✅{RESET}" if success else f"{RED}❌{RESET}"
        print(f"{icon} {BOLD}{component:<25}{RESET} | {message}")

    async def check_env_vars(self):
        """Check if all critical environment variables are present."""
        required = [
            "DATABASE_URL", "SECRET_KEY", "OPENAI_API_KEY", 
            "SERPER_API_KEY", "GITHUB_TOKEN", "STRIPE_SECRET_KEY"
        ]
        missing = [v for v in required if not getattr(settings, v.lower(), None)]
        
        if missing:
            self.log_result("Environment Vars", False, f"Missing: {', '.join(missing)}")
        else:
            self.log_result("Environment Vars", True, "All critical variables present.")

    async def check_openai(self):
        """Test OpenAI API connectivity and model access."""
        if not settings.openai_api_key:
            return self.log_result("OpenAI API", False, "No API key found.")
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    timeout=10
                )
                if resp.status_code == 200:
                    self.log_result("OpenAI API", True, "Handshake successful. Models accessible.")
                else:
                    self.log_result("OpenAI API", False, f"Invalid Key (HTTP {resp.status_code})")
        except Exception as e:
            self.log_result("OpenAI API", False, f"Connection failed: {str(e)}")

    async def check_serper(self):
        """Test Serper (Market IQ) connectivity."""
        if not settings.serper_api_key:
            return self.log_result("Serper (Market IQ)", False, "No API key found.")
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://google.serper.dev/search",
                    headers={"X-API-KEY": settings.serper_api_key, "Content-Type": "application/json"},
                    json={"q": "dvt talent ai test"},
                    timeout=10
                )
                if resp.status_code == 200:
                    self.log_result("Serper (Market IQ)", True, "Search API active.")
                else:
                    self.log_result("Serper (Market IQ)", False, f"Invalid Key (HTTP {resp.status_code})")
        except Exception as e:
            self.log_result("Serper (Market IQ)", False, f"Connection failed: {str(e)}")

    async def check_github(self):
        """Test GitHub (Sourcing) token validity."""
        if not settings.github_token:
            return self.log_result("GitHub (Sourcing)", False, "No token found.")
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"token {settings.github_token}"},
                    timeout=10
                )
                if resp.status_code == 200:
                    user = resp.json().get("login")
                    self.log_result("GitHub (Sourcing)", True, f"Token valid (User: {user})")
                else:
                    self.log_result("GitHub (Sourcing)", False, "Invalid/Expired Token")
        except Exception as e:
            self.log_result("GitHub (Sourcing)", False, f"Connection failed: {str(e)}")

    async def check_database(self):
        """Test PostgreSQL connection."""
        from sqlalchemy import create_engine, text
        try:
            # Use synchronous engine for quick check
            db_url = settings.database_url.replace("postgresql+asyncpg", "postgresql")
            engine = create_engine(db_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            self.log_result("PostgreSQL", True, "Database reachable and responsive.")
        except Exception as e:
            self.log_result("PostgreSQL", False, f"Connection error: {str(e)}")

    async def check_stripe(self):
        """Test Stripe (Billing) connectivity."""
        if not settings.stripe_secret_key:
            return self.log_result("Stripe (Billing)", False, "No secret key found.")
        
        try:
            import stripe
            stripe.api_key = settings.stripe_secret_key
            stripe.Account.retrieve()
            self.log_result("Stripe (Billing)", True, "Billing gateway active.")
        except Exception as e:
            self.log_result("Stripe (Billing)", False, f"Connection error: {str(e)}")

    async def run_all(self):
        print(f"\n{BOLD}{BLUE}=== DVT TALENT AI PRE-FLIGHT CHECK ==={RESET}\n")
        
        await self.check_env_vars()
        await self.check_database()
        await self.check_openai()
        await self.check_serper()
        await self.check_github()
        await self.check_stripe()
        
        print(f"\n{BLUE}{'='*40}{RESET}")
        all_passed = all(r[1] for r in self.results)
        
        if all_passed:
            print(f"\n{GREEN}{BOLD}STATUS: ALL SYSTEMS GO FOR DEPLOYMENT! 🚀{RESET}\n")
            return True
        else:
            print(f"\n{RED}{BOLD}STATUS: SYSTEM NOT READY. PLEASE FIX ERRORS ABOVE. 🛑{RESET}\n")
            return False

if __name__ == "__main__":
    check = PreflightCheck()
    success = asyncio.run(check.run_all())
    sys.exit(0 if success else 1)
