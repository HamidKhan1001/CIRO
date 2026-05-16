import json
import time
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="SEVERITY_PREDICTION_V3_ANTIGRAVITY",
    description="Forecast crisis evolution over next 1-6 hours",
    version="3.0.0"
)
class SeverityPredictionAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: SEVERITY_PREDICTION_V3_ANTIGRAVITY
Purpose: Forecast crisis evolution over next 1-6 hours
Input: classification (from Classifier), fused_signals

Prediction_Algorithm:
  1. Extract historical patterns (from DB if available)
  2. Consider crisis type:
     - FLOODING: Linear growth in affected area, exponential water volume
     - FIRE: Exponential spread (double every 15min until water)
     - HEATWAVE: Sustained peak (6+ hours)
     - EARTHQUAKE: Primary + aftershocks (decreasing severity)
  3. Factor in response_resources:
     - More resources → faster recovery (slope increase)
     - Fewer resources → longer escalation
  4. Generate timeline with 15min intervals
  5. Calculate uncertainty based on Signal credibility and time horizon.

Output Format:
Return a JSON object with:
- incident_id: string
- evolution_timeline: List of {time_minutes, stage, severity_level, affected_population, confidence, key_risks}
- peak_time_minutes: int
- peak_population: int
- timeline_uncertainty_percent: int
- population_uncertainty_percent: int
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: Dict[str, Any], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        prompt = f"Forecast evolution for this crisis:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "SEVERITY_PREDICTION_V3", 
            parent_execution_id, 
            start_time
        )
        return result
