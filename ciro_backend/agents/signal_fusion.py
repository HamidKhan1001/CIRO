import json
from typing import Any, Dict, List
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response

class SignalFusionAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
You are the Signal Fusion Agent for CIRO. Your job is to integrate 
disparate crisis signals into a unified picture.

INPUT: Raw signals from multiple sources (unstructured, noisy, possibly 
contradictory)

PROCESS:
1. Normalize all signals:
   - Extract: timestamp, location, source, text/data, credibility_indicator
   - Geocode locations (lat/lon, address, zone name)
   - Handle location ambiguity (report "near G-10" → cluster with other nearby reports)

2. Score source credibility (0-100):
   - Historical accuracy of this source (if available)
   - Timeliness of signal (fresh vs. stale)
   - Specificity of location (GPS vs. vague)
   - Language/urgency analysis (ALL CAPS = hype?)
   - Verification count (multiple people reporting same thing)
   - Authority level (official sensor > emergency call)

3. Detect & flag contradictions:
   - Example: Traffic map says "flooding congestion", Sensor says "normal flow"
   - Action: Flag as contradiction, recommend manual verification

4. Merge duplicates:
   - If two signals within 500m radius and 5 minutes apart, merge.

5. Output structured JSON ONLY. Do NOT wrap in markdown blocks like ```json.
Expected structure:
{
  "incident_id": "string",
  "primary_location": {"lat": float, "lon": float, "address": "string"},
  "fused_signals": [
    {
      "source": "emergency_call",
      "text": "string",
      "timestamp": "string",
      "credibility": float,
      "reason": "string"
    }
  ],
  "contradictions": [
    {
      "signals": ["string", "string"],
      "contradiction": "string",
      "confidence": float,
      "recommendation": "string"
    }
  ],
  "high_priority_flags": ["string"],
  "next_agent": "crisis_classifier_agent"
}
"""

    def process(self, input_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        prompt = f"Process these raw signals:\n{json.dumps(input_data, indent=2)}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if the LLM output is not perfect JSON
            print("Failed to decode JSON from Signal Fusion Agent. Returning raw text.")
            return {"error": "Invalid JSON", "raw_response": response_text}
