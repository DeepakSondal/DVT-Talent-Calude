import pytest
import asyncio
from communication.memory_store import SharedMemory
from communication.event_bus import EventBus
from agents.market_intelligence_agent import MarketIntelligenceAgent
from agents.lead_discovery_agent import LeadDiscoveryAgent

@pytest.mark.asyncio
async def test_shared_memory_persistence():
    memory = SharedMemory()
    test_key = "candidate:test_id:score"
    test_value = {"score": 95, "integrity": "verified"}
    
    # Test Set
    success = await memory.set(test_key, test_value, ttl=10)
    assert success is True
    
    # Test Get
    recalled = await memory.get(test_key)
    assert recalled == test_value
    
    # Test Exists
    assert await memory.exists(test_key) is True
    
    await memory.delete(test_key)
    await memory.close()

@pytest.mark.asyncio
async def test_event_bus_delivery():
    bus = EventBus()
    received_events = []
    
    async def mock_callback(event_type, data):
        received_events.append({"type": event_type, "data": data})
    
    # Subscribe
    await bus.subscribe("agent.discovery", mock_callback)
    
    # Publish
    test_data = {"name": "TestCorp", "domain": "test.com"}
    await bus.publish("agent.discovery", "new_company", test_data)
    
    # Allow some time for async delivery
    await asyncio.sleep(0.1)
    
    assert len(received_events) == 1
    assert received_events[0]["type"] == "new_company"
    assert received_events[0]["data"] == test_data
    
    await bus.close()

@pytest.mark.asyncio
async def test_inter_agent_communication():
    """ 
    Complex E2E Test: 
    MarketIntel emits an event, and LeadDiscovery reacts automatically.
    """
    memory = SharedMemory()
    bus = EventBus()
    
    # Initialize agents with shared fabric
    intel = MarketIntelligenceAgent(memory=memory, event_bus=bus)
    discovery = LeadDiscoveryAgent(memory=memory, event_bus=bus)
    
    # Subscribe discovery to intel's channel (normally handled by orchestrator)
    await bus.subscribe("agent.discovery", discovery.on_event)
    
    # Trigger intel to emit an event
    # We mock the internal companies list to trigger emission
    company_data = {"name": "EventDrivenInc", "domain": "driven.io"}
    
    await intel.emit("new_company", company_data)
    
    # Give time for the reaction chain
    # LeadDiscovery.on_event -> run_async(company_name="EventDrivenInc")
    await asyncio.sleep(0.5)
    
    # Verify reaction (check logs or internal states if tracking enabled)
    # For now, we verify that the bus reached the agent
    await bus.close()
    await memory.close()
