import json
import time
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="CRISIS_CLASSIFIER_V3_ANTIGRAVITY",
    description="Identify crisis type, severity, and confidence",
    version="3.0.0"
)
class CrisisClassifierAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: CRISIS_CLASSIFIER_V3_ANTIGRAVITY
Purpose: Identify crisis type, severity, and confidence
Input: fused_signals (from Signal Fusion), execution_metadata

Classification_Rules:
  FLOODING: "water" OR "flood" OR "rain" OR "overflow" AND location signals >3
  FIRE: "fire" OR "smoke" OR "burn" AND heat signals present
  HEATWAVE: temperature >40°C for >3 signals OR heat-related deaths
  EARTHQUAKE: seismic signals (official sensor) OR multiple reports in <1min
  CHEMICAL: "chemical" OR "hazmat" OR "toxic" AND official sensor warning
  DISEASE: "outbreak" OR "disease" OR "infection" with health authority warning
  COLLAPSE: "building" OR "structure" AND "collapse" OR "damage"
  EXPLOSION: "explosion" OR "blast" AND emergency calls
  OTHER: doesn't match above patterns

Severity_Logic:
  CRITICAL: 1000+ affected OR critical infrastructure threatened OR deaths reported
  HIGH: 100-1000 affected OR significant property damage OR emergency services needed
  MEDIUM: 10-100 affected OR localized impact OR containable situation
  LOW: <10 affected OR minor incident OR information only

Output Format:
Return a JSON object with:
- incident_id: string
- crisis_type: string
- crisis_subtype: string
- severity: str ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW")
- confidence: {type_confidence: float, severity_confidence: float, overall_confidence: float}
- affected_zone: {zone_name: string, radius_meters: int, affected_population: int}
- risk_factors: List[str]
- cascade_risks: List[str]
- expected_duration: string
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: Dict[str, Any], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        prompt = f"Classify this crisis data:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "CRISIS_CLASSIFIER_V3", 
            parent_execution_id, 
            start_time
        )
        return result
