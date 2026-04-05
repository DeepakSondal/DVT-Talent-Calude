"""
DVT Talent AI — Outreach Logic Tests
Verifies LLM prompt generation while mocking the actual Gmail delivery.
"""
import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock

from agents.outreach_agent import OutreachAgent

@pytest.mark.asyncio
async def test_outreach_email_content_generation():
    """Verify that OutreachAgent constructs the correct LLM prompt and handles response."""
    agent = OutreachAgent()
    
    candidate = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "skills": ["Python", "React"],
        "github_url": "github.com/janesmith"
    }
    
    context = {
        "job": {"title": "Fullstack Engineer", "skills_required": ["Python", "TypeScript"]},
        "company": {"name": "FutureAI"}
    }
    
    mock_email_json = {
        "subject": "Quick question about your Python work",
        "body": "Hi Jane, I saw your GitHub profile...",
        "variation_id": "A"
    }
    
    # We want to test that _write_candidate_email_async is called correctly
    # with patch.object(agent, '_write_candidate_email_async', return_value=mock_email_json) as mock_writer:
    # Actually the user wants to test the LLM prompt structure.
    
    with patch.object(agent, 'chat_async', new_callable=AsyncMock, return_value=json.dumps(mock_email_json)) as mock_chat:
        # We also mock _send_via_gmail as per user spec
        with patch.object(agent, '_send_via_gmail', return_value={"success": True, "message_id": "msg_mock"}):
                # Also mock DB save
            with patch.object(agent, '_save_to_db_async', new_callable=AsyncMock):
                
                result = await agent.run_async(
                    outreach_type="candidate",
                    recipient=candidate,
                    context=context,
                    send_email=True
                )
                
                # Verify LLM was called
                assert mock_chat.called
                args, kwargs = mock_chat.call_args
                prompt = args[1] # The user prompt
                
                # Check for key content in the prompt (Spec 2 requirements)
                assert "Jane" in prompt
                assert "FutureAI" in prompt
                assert "github.com/janesmith" in prompt
                
                assert result["sent"] is True
                assert result["subject"] == "Quick question about your Python work"
