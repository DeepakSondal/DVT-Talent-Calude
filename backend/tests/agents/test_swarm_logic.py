"""
DVT Talent AI — Swarm Agent Unit Tests
Tests the logic of individual agents with mocked external dependencies.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.lead_discovery_agent import LeadDiscoveryAgent
from agents.dice_sourcing_agent import DiceSourcingAgent

@pytest.mark.asyncio
async def test_market_intelligence_parallel_logic():
    """ Verify concurrent search and AI analysis """
    agent = MarketIntelligenceAgent()
    
    # Mock web search and AI chat
    mock_search = AsyncMock(return_value=[{"title": "Hiring Inc", "link": "hiring.com"}])
    mock_chat = AsyncMock(return_value='{"companies": [{"name": "Mock AI", "domain": "mock.ai"}]}')
    
    with patch.object(agent, 'search_web_async', mock_search), \
         patch.object(agent, 'chat_async', mock_chat):
        
        result = await agent.run_async(industry="AI", location="SF")
        
        assert "companies" in result
        assert len(result["companies"]) == 1
        assert result["companies"][0]["name"] == "Mock AI"
        # Ensure search was parallel (called multiple times for different queries)
        assert mock_search.call_count > 1

@pytest.mark.asyncio
async def test_lead_discovery_reaction():
    """ Verify agent reacts to company events and finds leads """
    agent = LeadDiscoveryAgent()
    
    # Mock lead extraction
    mock_search = AsyncMock(return_value=[{"title": "VP Eng", "link": "linkedin.com/in/vp"}])
    mock_chat = AsyncMock(return_value='{"contacts": [{"first_name": "Jane", "email": "jane@mock.ai"}]}')
    
    with patch.object(agent, 'search_web_async', mock_search), \
         patch.object(agent, 'chat_async', mock_chat):
        
        result = await agent.run_async(company_name="Mock AI", company_domain="mock.ai")
        
        assert len(result["contacts"]) == 1
        assert result["contacts"][0]["first_name"] == "Jane"

@pytest.mark.asyncio
async def test_dice_sourcing_filters():
    """ Verify tech-specific sourcing filters """
    agent = DiceSourcingAgent()
    
    # Mock Dice API response
    mock_dice = AsyncMock(return_value=[{"firstName": "Coder", "email": "coder@dice.com"}])
    
    with patch.object(agent, '_call_dice_api', mock_dice):
        result = await agent.run_async(skills=["Python", "Postgres"])
        
        assert len(result) == 1
        assert result[0]["firstName"] == "Coder"
