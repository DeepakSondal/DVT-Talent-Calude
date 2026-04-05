import asyncio
import json
import os
import sys

# Ensure this script runs perfectly inside the Docker container
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from unittest.mock import patch, AsyncMock
from agents.orchestrator import AgentOrchestrator

async def main():
    print("Starting full pipeline dry-run (mocked APIs)...")
    orchestrator = AgentOrchestrator()
    
    # Mocking LLM responses intelligently depending on the payload expectation
    mock_chat_str = json.dumps({
        "companies": [
            {
                "name": "MockCorp", 
                "domain": "mockcorp.test", 
                "hiring_signals": ["Series A"],
                "tech_stack": ["Python", "React"],
                "open_roles": ["Software Engineer"]
            }
        ],
        "contacts": [
            {
                "first_name": "Manager", 
                "last_name": "Bob", 
                "email": "bob@mockcorp.test", 
                "title": "VP of Eng", 
                "is_decision_maker": True, 
                "confidence": 90
            }
        ],
        "candidates": [
            {
                "first_name": "Alice", 
                "last_name": "Dev", 
                "email": "alice@dev.com", 
                "title": "Senior Engineer", 
                "skills": ["Python"]
            }
        ],
        "type": "pipeline",
        "title": "Mock Insights",
        "recommendation": "Go dry run",
        "priority": "high",
        "tech_stack": ["Python", "React"], 
        "open_roles": ["Backend Engineer"],
        "improvements": [{"area": "mocking", "suggestion": "Keep being awesome", "priority": "low"}]
    })
    
    mock_search_results = [{"title": "Mock Title", "link": "https://mockcorp.test/careers", "snippet": "We are hiring Engineers."}]

    with patch('agents.base_agent.BaseAgent.chat', return_value=mock_chat_str):
        with patch('agents.base_agent.BaseAgent.chat_async', new_callable=AsyncMock, return_value=mock_chat_str):
            with patch('agents.base_agent.BaseAgent.search_web', return_value=mock_search_results):
                with patch('agents.base_agent.BaseAgent.search_web_async', new_callable=AsyncMock, return_value=mock_search_results):
                    with patch('agents.outreach_agent.OutreachAgent._send_via_gmail', return_value={"success": True, "message_id": "dry_run_msg"}):
                        
                        try:
                            result = await orchestrator.run_full_pipeline(
                                industry="Space Exploration",
                                location="Mars",
                                send_emails=False
                            )
                            
                            print("\n=== PIPELINE RESULTS ===")
                            print(json.dumps(result.get("stages", {}), indent=2))
                            print("=== PIPELINE METRICS ===")
                            print(f"Duration: {result.get('duration_seconds')} seconds")
                            print(f"Error: {result.get('error', 'None')}")
                            
                            print("\nSuccess! No crashes occurred, agents returned dicts.")
                        except Exception as e:
                            print(f"\nPipeline crashed: {e}")
                            import traceback
                            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
