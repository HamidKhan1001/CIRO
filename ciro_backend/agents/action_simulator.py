import json
import time
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="ACTION_SIMULATOR_V3_ANTIGRAVITY",
    description="Predict outcomes and side effects of resource allocation",
    version="3.0.0"
)
class ActionSimulatorAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: ACTION_SIMULATOR_V3_ANTIGRAVITY
Purpose: Predict outcomes and side effects of resource allocation
Input: allocation_plan, severity_prediction

Simulation_Rules:
  1. For each resource type: model arrival time (distance/speed)
  2. Model effectiveness:
     - Ambulances: -10% mortality per 50 ambulances per 1000 people
     - Police: -5% panic per unit, +15% evacuation efficiency
     - Fire trucks: -20% fire spread per truck
     - Rescue teams: -30% trapped victims per team
     - Water tankers: -15% severity per tanker
  3. Estimate lives saved: (before_population - after_population) × mortality_rate
  4. Identify side effects:
     - Traffic congestion from evacuation
     - Secondary injuries from panic
     - Resource depletion for other areas
  5. Calculate failure risks:
     - Insufficient resources: probability = max(0, (need - available) / need)
     - Route blocked: probability = 0.1 (traffic/debris)
     - Communication failure: probability = 0.05

Output Format:
Return a JSON object with:
- incident_id: string
- simulated_actions: List of {action_id, action_description, resource_deployment, expected_outcome, confidence}
- before_state: {affected_population, severity}
- after_state: {affected_population, severity}
- impact_metrics: {lives_saved_estimate, response_time_reduction_minutes, coverage_improvement_percent}
- side_effects: List of {effect_type, severity, description}
- failure_risks: List of {risk_type, probability, mitigation}
- overall_simulation_summary: string
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: Dict[str, Any], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        prompt = f"Simulate actions based on this allocation plan:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "ACTION_SIMULATOR_V3", 
            parent_execution_id, 
            start_time
        )
        return result
