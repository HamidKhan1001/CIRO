import json
import time
from typing import Any, Dict, List, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="VERIFICATION_V3_ANTIGRAVITY",
    description="Async monitoring for false alarms, classification updates, retractions",
    version="3.0.0"
)
class VerificationAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: VERIFICATION_V3_ANTIGRAVITY
Purpose: Async monitoring for false alarms, classification updates, retractions
Input: initial_execution_data, new_signals (from streaming or polling)

Verification_Algorithm:
  1. Compare new signals to original incident classification
  2. Recalculate confidence using Signal Fusion logic
  3. Update severity if new_severity differs by >1 level
  4. Trigger retraction if:
     - overall_confidence drops below 0.40 (false alarm threshold)
     - No new signals in 30+ minutes (time decay, -1% per 5min)
     - Contradictory evidence from official sources
  5. Trigger escalation if:
     - overall_confidence increases AND new_severity > original
     - Cascading secondary crises detected

Output Format:
Return a JSON object with:
- incident_id: string
- initial_confidence: float
- updated_confidence: float
- classification_updated: bool
- updated_crisis_type: string or null
- confidence_trend: str ("INCREASING" | "STABLE" | "DECREASING")
- retraction_needed: bool
- retraction_message: string or null
- escalation_needed: bool
- escalation_reason: string or null
- lessons_learned: List[str]
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, initial_data: Dict[str, Any], new_signals: List[Dict[str, Any]], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        input_payload = {
            "initial_data": initial_data,
            "new_signals": new_signals
        }
        prompt = f"Verify the initial classification against new signals:\n{json.dumps(input_payload, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "VERIFICATION_V3", 
            parent_execution_id, 
            start_time
        )
        return result
