import json
import time
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="RESOURCE_ALLOCATOR_V3_ANTIGRAVITY",
    description="Optimize resource deployment across simultaneous crises",
    version="3.0.0"
)
class ResourceAllocatorAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: RESOURCE_ALLOCATOR_V3_ANTIGRAVITY
Purpose: Optimize resource deployment across simultaneous crises
Input: classification, prediction, available_resources

Allocation_Formula:
  priority_score = (0.35 × severity) + (0.25 × log10(population)) + (0.20 × urgency) + (0.15 × cascade_risk) + (0.05 × vulnerability)
  
  Severity: CRITICAL=1.0, HIGH=0.67, MEDIUM=0.33, LOW=0.0
  Urgency: (peak_time_minutes > 30) ? 0.5 : (peak_time_minutes > 15) ? 0.75 : 1.0
  Cascade_Risk: probability of secondary crises (0.0-1.0)
  Vulnerability: population age >65 or <5 (0.0-1.0)
  
  Resource_Allocation:
  - Calculate priority_score for each active incident
  - Allocate resources by priority (largest first)
  - Leave 20% reserve for new incidents
  - Optimize for minimal total_cost_per_hour_usd

Output Format:
Return a JSON object with:
- incident_id: string
- allocation_plan: List of {resource_type, quantity, priority, estimated_arrival_minutes, impact_lives_saved, impact_property_saved_usd}
- total_cost_per_hour_usd: float
- trade_offs: List[str]
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: Dict[str, Any], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        # input_data should contain 'prediction', 'classification', and 'available_resources'
        prompt = f"Allocate resources for this situation:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "RESOURCE_ALLOCATOR_V3", 
            parent_execution_id, 
            start_time
        )
        return result
