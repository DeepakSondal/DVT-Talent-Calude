"""
DVT Talent AI — Verification Agent
Verifies candidate claims (employment, education, certifications) against public data.
Eliminates AI hallucinations and ensures talent integrity.
"""
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
import json

class VerificationAgent(BaseAgent):
    def __init__(self, memory=None, event_bus=None):
        super().__init__(
            name="verification",
            description="Verifies candidate claims (employment, education) against public records and cross-references data",
            memory=memory,
            event_bus=event_bus
        )

    async def run_async(
        self,
        candidate_data: Dict[str, Any],
        deep_verify: bool = False
    ) -> Dict[str, Any]:
        self.log_start(f"Verifying claims for {candidate_data.get('first_name')} {candidate_data.get('last_name')}")
        
        # 1. Extract claims to verify
        claims = self._extract_claims(candidate_data)
        
        # 2. Cross-reference with web search
        verification_results = []
        for claim in claims:
            query = f"{candidate_data.get('first_name')} {candidate_data.get('last_name')} {claim}"
            search_results = await self.search_web_async(query, num_results=3)
            
            # Use LLM to judge if search results confirm the claim
            is_verified = await self._judge_verification(claim, search_results)
            verification_results.append({
                "claim": claim,
                "verified": is_verified,
                "confidence": 0.9 if is_verified else 0.2,
                "sources": [r.get("link") for r in search_results]
            })

        # 3. Aggregate results
        overall_integrity = sum([1 for v in verification_results if v["verified"]]) / len(verification_results) if verification_results else 1.0
        
        result = {
            "candidate_id": candidate_data.get("id"),
            "integrity_score": round(overall_integrity * 100, 2),
            "verification_trail": verification_results,
            "warnings": [v["claim"] for v in verification_results if not v["verified"]]
        }
        
        self.log_complete(f"Verification complete. Integrity score: {result['integrity_score']}")
        return result

    def _extract_claims(self, candidate: Dict[str, Any]) -> List[str]:
        """Extract high-stakes claims like degrees or major companies"""
        claims = []
        if candidate.get("current_company"):
            claims.append(f"worked at {candidate['current_company']}")
        if candidate.get("education"):
            for edu in candidate["education"]:
                claims.append(f"degree from {edu.get('university')}")
        # Default fallback
        if not claims:
            claims.append("software engineer")
        return claims[:3]

    async def _judge_verification(self, claim: str, search_results: List[Dict[str, Any]]) -> bool:
        """Use LLM to determine if search results support the claim"""
        if not search_results: return False
        
        prompt = f"Claim: {claim}\nSearch Evidence: {json.dumps(search_results)}\nDoes the evidence strongly support the claim? Respond with 'YES' or 'NO' and nothing else."
        response = await self.chat_async("You are a verification judge.", prompt)
        return "YES" in response.upper()
