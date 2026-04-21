"""
DVT Talent AI — Outreach Agent (Unified)
Merges Email, Voice (Mock), Microsite generation, and Conflict Resolution.
Replaces: OutreachAgent, MicrositeAgent, ConflictResolutionAgent (logic).
"""
import json
import asyncio
import random
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime

from agents.base_agent import BaseAgent
from services.email_service import EmailService
from config import settings

SYSTEM_PROMPT = """You are an Outreach Agent for DVT Talent AI.
Your mission:
1. EMAIL: Draft personalized, high-converting outreach emails.
2. VOICE: Generate scripts for AI voice calls (simulated).
3. MICROSITE: Generate personalized landing page content for top-tier candidates.
4. COORDINATION: Ensure no candidate is contacted twice for the same role (handled via state).

Respond ONLY with valid JSON. No extra text."""

class OutreachAgent(BaseAgent):
    """
    Unified outreach engine that handles:
    - Multi-channel communication (Email, Voice, Microsite).
    - In-agent Conflict Resolution using Redis locks.
    """

    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="outreach",
            description="Manages personalized email and voice outreach with built-in conflict prevention",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(
        self, 
        candidate: Dict[str, Any],
        job: Dict[str, Any],
        channels: List[str] = ['email'],
        enable_microsite: bool = False
    ) -> Dict[str, Any]:
        self.log_start(f"Initiating outreach for {candidate.get('first_name')}")
        
        # 1. Conflict Resolution (Redis Lock)
        lock_key = f"outreach_lock:{candidate.get('email') or candidate.get('id')}:{job.get('id')}"
        is_locked = await self.recall(lock_key)
        if is_locked:
            self.log.info("outreach_prevented", candidate=candidate.get('email'), reason="already_contacted")
            return {"status": "skipped", "reason": "conflict_prevented"}

        # Set lock for 7 days
        await self.remember(lock_key, {"status": "contacted", "date": datetime.utcnow().isoformat()}, ttl=60*60*24*7)

        results = {"channels": {}}

        # 2. Multichannel Outreach Generation
        if 'email' in channels:
            email_draft = await self._draft_email(candidate, job)
            results["channels"]["email"] = email_draft
            
            # [NEW] Actually SEND the email using the EmailService
            if candidate.get("email"):
                # We generate a dummy Email ID here for tracing. 
                # In production, this would be tied to the EmailSent DB record.
                email_db_id = str(uuid.uuid4())
                sender = EmailService()
                sent_success = await sender.send_email(
                    email_id=email_db_id,
                    to_address=candidate["email"],
                    subject=email_draft.get("subject", "Opportunity"),
                    body=email_draft.get("body", "")
                )
                results["channels"]["email"]["delivery_status"] = "sent" if sent_success else "failed"

        if 'voice' in channels:
            results["channels"]["voice"] = await self._draft_voice_script(candidate, job)
        if enable_microsite:
            results["channels"]["microsite"] = await self._generate_microsite(candidate, job)

        self.log_complete(f"Outreach drafted via channels: {list(results['channels'].keys())}")
        return results

    async def _draft_email(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        # [NEW] Advanced Gap 3: Deliverability Governor
        # Natural jitter delay to mimic human behavior and avoid spam flags
        jitter = random.uniform(2.0, 10.0)
        self.log.info("deliverability_governor_active", delay=round(jitter, 2))
        await asyncio.sleep(jitter)

        prompt = f"Draft a cold email to {candidate.get('first_name')} about a {job.get('title')} role at {job.get('company_name')}."
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response)
        except:
            return {"subject": "Quick question", "body": f"Hi {candidate.get('first_name')}, interested in a new role?"}

    async def _draft_voice_script(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Generate a 30-second AI voice call script for {candidate.get('first_name')} regarding {job.get('title')}."
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response)
        except:
            return {"script": "Hi, this is Alex from DVT Talent AI. Calling about a staff engineer role..."}

    async def _generate_microsite(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Generate personalized microsite content for {candidate.get('first_name')} for {job.get('title')}."
        try:
            # Reusing the chat_async but with microsite specific prompt
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            return json.loads(response)
        except:
            return {"title": "A custom role for you"}
