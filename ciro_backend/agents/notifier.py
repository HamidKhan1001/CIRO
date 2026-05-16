import json
import time
from typing import Any, Dict, Optional
from agents.base_agent import BaseAgent
from utils.gemini_client import generate_json_response
from utils.antigravity_utils import agent, create_execution_metadata

@agent(
    name="NOTIFIER_V3_ANTIGRAVITY",
    description="Generate audience-specific crisis alerts",
    version="3.0.0"
)
class NotifierAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
Agent_Name: NOTIFIER_V3_ANTIGRAVITY
Purpose: Generate audience-specific crisis alerts
Input: classification, severity_prediction, simulation

Message_Templates:
  PUBLIC:
    CRITICAL: "ALERT: {crisis_type} detected in {zone}. Evacuate immediately. Go to {shelter}. Updates: {phone_number}"
    HIGH: "{crisis_type} in {zone}. Follow instructions from officials. Stay {direction}. {updates_url}"
    MEDIUM: "{crisis_type} reported in {zone}. Monitor situation. Avoid area. {updates_url}"
  
  RESPONDERS:
    "INCIDENT: {crisis_type} at {lat},{lon}. Severity: {severity}. Estimated {population} affected. Assets allocated: {resources}. Eta: {minutes}min"
  
  HOSPITALS:
    "SURGE ALERT: Potential {population} casualties from {crisis_type}. Activate mass casualty plan. Blood types: {prediction}"
  
  UTILITIES:
    "SERVICE RISK: {crisis_type} may affect water/power. Status: {status}. Isolation point: {location}"
  
  MEDIA:
    "Crisis: {crisis_type} in {zone} affecting ~{population}. Official sources: {contact}. No local deaths reported yet."

Notification_Rules:
  - Don't send if confidence < 0.60
  - Escalate messaging every 15 minutes
  - Include retraction messages if confidence drops below 0.40

Output Format:
Return a JSON object with:
- incident_id: string
- notification_plan: List of {audience, channel, message, urgency, confidence_threshold, scheduled_updates}
- media_release: string or null
- error: string or null
- reason: string or null

Do NOT wrap in markdown blocks.
"""

    def execute(self, input_data: Dict[str, Any], parent_execution_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        prompt = f"Create a notification plan based on this data:\n{json.dumps(input_data, indent=2)}\nParent Execution ID: {parent_execution_id}"
        response_text = generate_json_response(prompt, self.get_system_prompt())
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON", "reason": response_text}
            
        result["execution_metadata"] = create_execution_metadata(
            "NOTIFIER_V3", 
            parent_execution_id, 
            start_time
        )
        return result
