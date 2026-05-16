import json
import time
from typing import Any, Dict, List, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="SIGNAL_FUSION_V3_ANTIGRAVITY",
    description="Aggregate multi-source crisis signals",
    version="3.0.0"
)
class SignalFusionAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: SIGNAL_FUSION_V3_ANTIGRAVITY
Purpose: Multi-source signal aggregation with credibility scoring
Input_Schema:
  signals:
    type: List[Signal]
    constraints: "1-20 signals, each with source/timestamp/location/text"
  parent_execution_id:
    type: Optional[str]
    purpose: "Antigravity trace linking"

Algorithm: CREDIBILITY_SCORING_V2
  1. Normalize all signals to {timestamp, location, source, text, metadata}
  2. Validate location exists (else skip signal)
  3. Score each signal's credibility:
     - Base credibility by source (official_sensor=0.88, social_media=0.35, etc)
     - Adjust: -5% per 10min age, -15% panic tone, +20% GPS, -30% verbal location
     - Multiply by verification signals (if reported >5 times: +0.15)
  4. Detect contradictions:
     - |severity_A - severity_B| > 2 AND |confidence_A - confidence_B| > 0.30 → FLAG
     - Compare locations: distance >1km AND same timestamp → FLAG
  5. Deduplicate: Same location (500m) + same time (5min) → merge (keep highest credibility)
  6. Fuse credibility: weighted_average(credibilities, weights=normalized_counts)
  7. Output with full trace

Output Format:
Return a JSON object with:
- incident_id: string
- primary_location: {lat: float, lon: float, address: string, confidence: float}
- fused_signals: list of {signal_id, source, text, credibility, weight, contribution}
- contradictions: list of {signal_pairs, type, severity}
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: List[Dict[str, Any]], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        prompt = f"Process these raw signals:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "SIGNAL_FUSION_V3", 
            parent_execution_id, 
            start_time
        )
        return result
