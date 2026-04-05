"""
DVT Talent AI — Outreach Agent
Writes hyper-personalized cold emails and manages sending via Gmail API.
Handles candidate outreach AND client/lead outreach.
"""
import json
import base64
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from agents.base_agent import BaseAgent
from config import settings


SYSTEM_PROMPT = """You are an elite email copywriter and outreach specialist for DVT Talent AI.
You write short, highly personalized, human-sounding cold emails that get replies.

Core principles:
1. SHORT: Max 5 sentences. No fluff.
2. PERSONAL: Reference specific details about the recipient or company
3. VALUE-FIRST: Lead with what's in it for them
4. SINGLE CTA: One clear ask (a reply, a quick call)
5. HUMAN: Sound like a real person, not a bot
6. NO BUZZWORDS: Never say "synergy", "circle back", "leverage"

For candidate outreach: Make the opportunity sound exciting. Be brief.
For client outreach: Lead with candidates you have. Show results.

Return ONLY valid JSON. No extra text."""


class OutreachAgent(BaseAgent):
    """
    Writes & sends personalized outreach emails.
    Handles two modes:
    - Candidate outreach: Reaching out to potential candidates about open roles
    - Client outreach: Reaching out to HR managers about placing candidates
    """

    def __init__(self):
        super().__init__(
            name="outreach",
            description="Writes and sends personalized cold emails for recruiting outreach",
        )

    async def run_async(
        self,
        outreach_type: str,  # "candidate" or "client"
        recipient: Dict[str, Any],
        context: Dict[str, Any],
        send_email: bool = False,
    ) -> Dict[str, Any]:
        recipient_name = f"{recipient.get('first_name', '')} {recipient.get('last_name', '')}".strip() or recipient.get('email', 'unknown')
        self.log_start(f"Drafting {outreach_type} outreach to {recipient_name}")

        try:
            if outreach_type == "candidate":
                email_data = await self._write_candidate_email_async(recipient, context)
            elif outreach_type == "client":
                email_data = await self._write_client_email_async(recipient, context)
            else:
                raise ValueError(f"Unknown outreach type: {outreach_type}")

            result = {
                "to_email": recipient.get("email"),
                "subject": email_data.get("subject", ""),
                "body": email_data.get("body", ""),
                "preview_text": email_data.get("preview", ""),
                "follow_up_day": email_data.get("follow_up_day", 3),
                "tracking_id": str(uuid.uuid4()),
                "sent": False,
            }

            if send_email and recipient.get("email") and settings.gmail_sender_email:
                send_result = self._send_via_gmail(
                    to_email=recipient["email"],
                    subject=result["subject"],
                    body=result["body"],
                    tracking_id=result["tracking_id"],
                )
                result["sent"] = send_result.get("success", False)
                result["gmail_message_id"] = send_result.get("message_id")

            # Save to Database (Async)
            await self._save_to_db_async(outreach_type, recipient, result, context)

            self.log_complete(f"Email drafted for {recipient_name}, sent={result['sent']}")
            return result

        except Exception as e:
            self.log_error(e)
            return {"error": str(e), "sent": False}

    async def _save_to_db_async(self, outreach_type: str, recipient: Dict[str, Any], result: Dict[str, Any], context: Dict[str, Any]):
        """Asynchronously save the outreach attempt to the database for tracking & review"""
        try:
            from db.models import AsyncSessionLocal, EmailCampaign, EmailSent
            from sqlalchemy import select
            
            async with AsyncSessionLocal() as session:
                # 1. Ensure a default campaign exists if not provided
                campaign_id = context.get("campaign_id")
                if not campaign_id:
                    # Find or create a 'General' campaign
                    campaign_name = f"General {outreach_type.capitalize()} Outreach"
                    stmt = select(EmailCampaign).where(EmailCampaign.name == campaign_name)
                    res = await session.execute(stmt)
                    campaign = res.scalar_one_or_none()
                    
                    if campaign:
                        campaign_id = campaign.id
                    else:
                        campaign = EmailCampaign(
                            name=campaign_name, 
                            campaign_type=f"{outreach_type}_outreach", 
                            is_active=True
                        )
                        session.add(campaign)
                        await session.flush()
                        campaign_id = campaign.id

                try:
                    tracking_uid = uuid.UUID(result["tracking_id"])
                except ValueError:
                    self.log.error("invalid_tracking_id", tracking_id=result["tracking_id"])
                    tracking_uid = uuid.uuid4()

                # 2. Insert EmailSent record
                new_email = EmailSent(
                    id=tracking_uid,
                    campaign_id=campaign_id,
                    to_email=result["to_email"],
                    subject=result["subject"],
                    body=result["body"],
                    status="sent" if result["sent"] else "draft",
                    sent_at=datetime.utcnow() if result["sent"] else None
                )
                session.add(new_email)
                await session.commit()
        except Exception as e:
            self.log.error("db_save_failed", error=str(e))

    async def _write_candidate_email_async(self, candidate: Dict[str, Any], context: Dict[str, Any], variation: str = "A") -> dict:
        """Write personalized email to a candidate about an opportunity with A/B testing support"""
        job = context.get("job", {})
        company = context.get("company", {})
        
        # Adjust prompt based on variation
        variation_instruction = ""
        if variation == "B":
            variation_instruction = "Try a more aggressive, 'Problem-First' angle (e.g., 'Frustrated with [Legacy Tech]?')."
        else:
            variation_instruction = "Use the standard, 'Benefit-First' angle (e.g., 'Build the future of [Industry]')."

        user_prompt = f"""Write a short, personalized cold email to this software engineer about a job opportunity.
        
        ANGLE: {variation_instruction}

        CANDIDATE:
        - Name: {candidate.get('first_name', 'there')} {candidate.get('last_name', '')}
        - Current title: {candidate.get('title', 'Software Engineer')}
        - Current company: {candidate.get('current_company', 'their company')}
        - Top skills: {', '.join(candidate.get('skills', [])[:5])}
        - LinkedIn: {candidate.get('linkedin_url', 'N/A')}
        - GitHub: {candidate.get('github_url', 'N/A')}
        
        JOB OPPORTUNITY:
        - Role: {job.get('title', 'Senior Software Engineer')}
        - Company: {company.get('name', 'an exciting startup')}
        - Tech stack: {', '.join(job.get('skills_required', [])[:5])}
        
        Return JSON:
        {{
          "subject": "Quick question about your Python work",
          "body": "Hi [Name],\\n\\n[3-4 sentence email]\\n\\nBest,\\nAlex\\nDVT Talent AI",
          "preview": "First line of email...",
          "variation_id": "{variation}",
          "personalization_used": "GitHub contributions in Python"
        }}"""

        try:
            response = await self.chat_async(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.7)
            return json.loads(response)
        except Exception:
            return {
                "subject": f"Opportunity: {job.get('title', 'Senior Engineer')} role",
                "body": f"Hi {candidate.get('first_name', 'there')},\n\nI came across your profile and think you'd be a great fit for a {job.get('title', 'senior engineering')} role at {company.get('name', 'an exciting company')}.\n\nBest,\nAlex\nDVT Talent AI",
                "variation_id": variation,
            }

    async def analyze_reply_sentiment(self, email_body: str) -> Dict[str, Any]:
        """Automatically classify a candidate reply as positive, negative, or neutral and suggest next steps."""
        self.log_start("Analyzing reply sentiment")
        
        prompt = f"""Analyze the sentiment and intent of this candidate's reply to our outreach email.
        
        REPLY EMAIL:
        {email_body[:2000]}
        
        Classify into:
        1. INTERESTED: (Positive) Wants a call, asks for more info, or says 'tell me more'.
        2. NOT_INTERESTED: (Negative) Explicitly says no, or 'take me off the list'.
        3. NEEDS_INFO: (Neutral) Asks a specific question (e.g., 'Is it remote?', 'What's the salary?').
        4. OOO: (Auto-reply) Out of office or automatic response.
        
        Return JSON:
        {{
          "sentiment": "INTERESTED|NOT_INTERESTED|NEEDS_INFO|OOO",
          "confidence": 95,
          "auto_response_draft": "Draft of what to say next based on the reply...",
          "next_action": "Schedule Call|Archive|Follow up with info",
          "extracted_questions": ["What is the salary range?"]
        }}"""
        
        try:
            response = await self.chat_async(SYSTEM_PROMPT, prompt, json_mode=True)
            result = json.loads(response)
            self.log_complete(f"Sentiment analyzed: {result.get('sentiment')}")
            return result
        except Exception as e:
            self.log_error(e)
            return {"sentiment": "NEEDS_INFO", "error": str(e)}

    async def _write_client_email_async(self, contact: Dict[str, Any], context: Dict[str, Any]) -> dict:
        """Write personalized email to a hiring manager/HR director"""
        company = context.get("company", {})
        candidates = context.get("candidates", [])
        open_roles = context.get("open_roles", [])

        candidate_teaser = ""
        if candidates:
            candidate_teaser = f"I currently have {len(candidates)} pre-vetted {open_roles[0] if open_roles else 'senior engineer'}s available immediately."

        company_name = company.get('name', 'your company')
        user_prompt = f"""Write a short, compelling cold email to this hiring manager about recruiting services.

RECIPIENT:
- Name: {contact.get('first_name', 'there')} {contact.get('last_name', '')}
- Title: {contact.get('title', 'VP of Engineering')}
- Company: {company_name}
- Company industry: {company.get('industry', 'technology')}
- Company size: {company.get('size', '51-200')}

CONTEXT:
- Their open roles: {', '.join(open_roles[:3]) if open_roles else 'software engineers'}
- Hiring signals: {', '.join([str(s) for s in company.get('hiring_signals', [])[:2]])}
- {candidate_teaser}

ANGLE: Lead with the candidate teaser if available. Otherwise lead with a specific observation about their company.
Keep it to 4 sentences max. End with one soft CTA.

Return JSON:
{{
  "subject": "3 senior Python engineers → {company_name}?",
  "body": "Hi [Name],\\n\\n[4 sentence email]\\n\\nBest,\\nAlex\\nDVT Talent AI",
  "preview": "First line...",
  "follow_up_day": 4,
  "angle_used": "candidate teaser"
}}"""

        try:
            response = await self.chat_async(SYSTEM_PROMPT, user_prompt, json_mode=True, temperature=0.7)
            data = json.loads(response)
            # Replace placeholder if still present
            data["subject"] = data.get("subject", "").replace("{company_name}", company_name)
            return data
        except Exception:
            return {
                "subject": f"Senior engineers for {company.get('name', 'your team')}",
                "body": f"Hi {contact.get('first_name', 'there')},\n\nI saw {company.get('name', 'your company')} is expanding its engineering team. I specialize in placing senior {open_roles[0] if open_roles else 'software'} engineers and have a few strong candidates available now.\n\nWould it be worth a quick call this week?\n\nBest,\nAlex\nDVT Talent AI",
                "preview": "Senior engineers available",
                "follow_up_day": 4,
            }

    def generate_follow_up(self, original_email: Dict[str, Any], day_number: int = 1) -> dict:
        """Generate follow-up email for no-reply sequences"""
        follow_up_templates = [
            {
                "subject": f"Re: {original_email.get('subject', '')}",
                "body": f"Hi,\n\nJust bumping this up in case it got buried. Happy to share more details if helpful.\n\nBest,\nAlex",
            },
            {
                "subject": f"Re: {original_email.get('subject', '')}",
                "body": f"Hi,\n\nLast follow-up from me — if the timing isn't right, no worries at all. Happy to reconnect whenever works better.\n\nBest,\nAlex",
            },
        ]
        index = min(day_number - 1, len(follow_up_templates) - 1)
        return follow_up_templates[index]

    def _send_via_gmail(self, to_email: str, subject: str, body: str, tracking_id: str) -> dict:
        """Send email via Gmail API with open tracking pixel"""
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=None,
                refresh_token=settings.gmail_refresh_token,
                client_id=settings.gmail_client_id,
                client_secret=settings.gmail_client_secret,
                token_uri="https://oauth2.googleapis.com/token",
            )
            service = build("gmail", "v1", credentials=creds)

            # FIX [M-07]: Use APP_BASE_URL from settings, not hardcoded placeholder
            tracking_pixel = (
                f'<img src="{settings.app_base_url}/api/v1/track/{tracking_id}/open" '
                f'width="1" height="1" style="display:none" />'
            )
            html_body = body.replace("\n", "<br>") + tracking_pixel

            message = MIMEMultipart("alternative")
            message["to"] = to_email
            message["from"] = settings.gmail_sender_email
            message["subject"] = subject
            message.attach(MIMEText(body, "plain"))
            message.attach(MIMEText(html_body, "html"))

            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            sent = service.users().messages().send(
                userId="me", body={"raw": raw}
            ).execute()

            return {"success": True, "message_id": sent["id"]}

        except Exception as e:
            self.log.error("gmail_send_failed", error=str(e))
            return {"success": False, "error": str(e)}

    async def write_bulk_campaign(
        self,
        outreach_type: str,
        recipients: List[Dict[str, Any]],
        context: Dict[str, Any],
        send: bool = False,
    ) -> List[Dict[str, Any]]:
        """Write emails for a bulk campaign (Asynchronous)"""
        results = []
        for recipient in recipients:
            result = await self.run(outreach_type, recipient, context, send_email=send)
            result["recipient_id"] = recipient.get("id") or recipient.get("email")
            results.append(result)
        return results
