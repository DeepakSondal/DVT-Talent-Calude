"""
DVT Talent AI — Email & Gmail Service
Handles sending emails via SMTP/Gmail and tracking replies.
"""
import smtplib
from email.message import EmailMessage
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import structlog
from db.models import AsyncSessionLocal, EmailSent, EmailStatus
from sqlalchemy import select
from config import settings

log = structlog.get_logger()

class EmailService:
    def __init__(self):
        # Fallback to standard SMTP if OAuth is not configured
        self.smtp_host = settings.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(settings.get("SMTP_PORT", 587))
        self.smtp_user = settings.get("SMTP_USER")
        self.smtp_pass = settings.get("SMTP_PASS")  # App Password for Gmail

    async def send_email(self, email_id: str, to_address: str, subject: str, body: str) -> bool:
        """Sends an email and updates the DB status to SENT"""
        if not self.smtp_user or not self.smtp_pass:
            log.warning("email_auth_missing", msg="Skipping actual email delivery (Draft only)")
            return False

        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = self.smtp_user
        msg['To'] = to_address
        
        # Inject tracking headers
        msg['Message-ID'] = f"<{email_id}@dvt-talent-ai.com>"
        msg['In-Reply-To'] = msg['Message-ID']
        msg['References'] = msg['Message-ID']

        try:
            # Note: SMTP is blocking. In a true enterprise setup, this should be an async-mailer or celery task.
            # Wrapping tightly as this is a pilot integration.
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
                
            # Update DB Status
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(EmailSent).where(EmailSent.id == email_id))
                email_obj = result.scalar_one_or_none()
                if email_obj:
                    email_obj.status = EmailStatus.SENT
                    email_obj.sent_at = datetime.now(timezone.utc)
                    email_obj.gmail_message_id = msg['Message-ID']
                    await session.commit()
                    
            log.info("email_sent_successfully", email_id=email_id, to=to_address)
            return True

        except Exception as e:
            log.error("email_send_failed", error=str(e), email_id=email_id)
            return False

    async def process_incoming_webhook(self, payload: Dict[str, Any]) -> bool:
        """
        Processes a webhook from an email provider (like SendGrid Inbound Parse or a Gmail Watcher).
        Marks the original email as REPLIED.
        """
        # Example payload from a standard webhook: {"Headers": {...}, "From": "...", "TextBody": "..."}
        # We need to extract the original Message-ID from the 'In-Reply-To' or 'References' headers.
        
        headers = payload.get("Headers", {})
        # Flatten headers if it's a list
        if isinstance(headers, list):
            headers = {h.get("Name"): h.get("Value") for h in headers}
            
        in_reply_to = headers.get("In-Reply-To")
        
        if not in_reply_to:
            log.warning("unmatched_reply", msg="No In-Reply-To header found")
            return False

        async with AsyncSessionLocal() as session:
            # Find the original sent email
            result = await session.execute(select(EmailSent).where(EmailSent.gmail_message_id == in_reply_to))
            email_obj = result.scalar_one_or_none()
            
            if email_obj and email_obj.status != EmailStatus.REPLIED:
                email_obj.status = EmailStatus.REPLIED
                email_obj.replied_at = datetime.now(timezone.utc)
                await session.commit()
                log.info("email_reply_tracked", email_id=email_obj.id, replier=payload.get("From"))
                return True
                
        return False
