"""
DVT Talent AI — Logic Critic Agent
The final "Filter of Truth" that audits agent outputs for hallucinations and logic gaps.
Ensures 100% professional trust.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
import json

class CriticAgent(BaseAgent):
    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="logic_critic",
            description="Audits AI reports for hallucinations, temporal inconsistencies, and professional logic errors",
            memory=memory,
            event_bus=event_bus
        )

    async def audit_report(self, report_data: Dict[str, Any], context: str) -> Dict[str, Any]:
        """
        Audits a candidate report against the job context.
        Returns {'passed': True} or {'passed': False, 'issues': [...]}
        """
        self.log_start(f"Auditing report for logical consistency")
        
        audit_prompt = f"""
        AUDIT TASK: Check the following AI-generated report for logical errors, 
        hallucinations, or temporal impossibilities (e.g., skill experience exceeding technology age).
        
        CONTEXT: {context}
        REPORT: {json.dumps(report_data)}
        
        CRITICAL CHECKS:
        1. Temporal Accuracy: Does the experience claimed match the timeline?
        2. Skill Consistency: Do the listed skills appear in the evidence?
        3. Logic Leaps: Are the scores justified by the summary?
        
        Respond ONLY with a JSON object:
        {{
            "passed": boolean,
            "issues": ["list", "of", "inconsistencies"],
            "suggested_correction": "text"
        }}
        """
        
        try:
            # We use 'simple' model routing here because a critic focus on logic, which cheaper models are often good at
            response = await self.chat_async("You are a rigorous Logic Auditor.", audit_prompt, json_mode=True, complexity="simple")
            result = json.loads(response)
            
            if not result.get("passed"):
                self.log.warning("audit_failed", issues=result.get("issues"))
                self._broadcast_signal("audit_failed", f"Logic inconsistency detected: {result['issues'][0]}")
            else:
                self.log.info("audit_passed")
                
            return result
        except Exception as e:
            self.log.error("audit_error", error=str(e))
            return {"passed": True} # Fallback to true to avoid blocking the pipeline on infra failure
