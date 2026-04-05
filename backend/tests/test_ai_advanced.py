"""
DVT Talent AI — Advanced AI Test Suite
Tests the new 'Smarter' features: JD Optimizer, Learning Agent, 
Outreach Sentiment, and Hybrid Matching.
"""
import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock

from agents.job_description_agent import JobDescriptionAgent
from agents.learning_agent import LearningAgent
from agents.outreach_agent import OutreachAgent
from agents.resume_analysis_agent import ResumeAnalysisAgent

@pytest.mark.asyncio
async def test_job_description_agent_optimization():
    """Test JD Optimizer's ability to structure messy text."""
    agent = JobDescriptionAgent()
    raw_jd = "Looking for a senior python dev with 5 years exp. remote ok. pays 150k."
    
    mock_resp = {
        "structured": {
            "title": "Senior Python Developer",
            "must_haves": ["5+ years experience"],
            "experience_range": "5+ years"
        }
    }
    
    with patch.object(agent, 'chat_async', new_callable=AsyncMock, return_value=json.dumps(mock_resp)):
        result = await agent.run_async(raw_jd)
        assert result["structured"]["title"] == "Senior Python Developer"
        assert "must_haves" in result["structured"]

@pytest.mark.asyncio
async def test_learning_agent_ab_analysis():
    """Test Learning Agent's A/B test winning logic."""
    agent = LearningAgent()
    stats = [
        {"variation": "A", "sent": 100, "replies": 35},
        {"variation": "B", "sent": 100, "replies": 5}
    ]
    
    mock_resp = {
        "winner": "A",
        "reasoning": "Variation A has 35% reply rate vs 5% for B.",
        "retire_variation": "B"
    }
    
    with patch.object(agent, 'chat_async', new_callable=AsyncMock, return_value=json.dumps(mock_resp)):
        result = await agent.run_async(stats)
        assert result["winner"] == "A"
        assert result["retire_variation"] == "B"

@pytest.mark.asyncio
async def test_outreach_sentiment_analysis():
    """Test Outreach Agent's ability to classify reply sentiment."""
    agent = OutreachAgent()
    reply = "This looks interesting! I'd love to chat. Can we do Wednesday at 3pm?"
    
    mock_resp = {
        "sentiment": "INTERESTED",
        "confidence": 98,
        "next_action": "Schedule Call"
    }
    
    with patch.object(agent, 'chat_async', new_callable=AsyncMock, return_value=json.dumps(mock_resp)):
        result = await agent.analyze_reply_sentiment(reply)
        assert result["sentiment"] == "INTERESTED"
        assert result["next_action"] == "Schedule Call"

@pytest.mark.asyncio
async def test_resume_success_prediction():
    """Test AI-driven hiring success prediction logic."""
    agent = ResumeAnalysisAgent()
    parsed = {"total_experience_years": 8, "skills": ["Python", "Kubernetes"]}
    
    mock_resp = {
        "success_probability": 92,
        "retention_risk": "low",
        "reasoning": "Deep technical expertise and stable history."
    }
    
    with patch.object(agent, 'chat', return_value=json.dumps(mock_resp)):
        result = agent.predict_hiring_success_metrics(parsed)
        assert result["success_probability"] == 92
        assert result["retention_risk"] == "low"
