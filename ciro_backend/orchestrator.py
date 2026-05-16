import json
import uuid
from typing import List, Dict, Any, Optional

from agents.signal_fusion import SignalFusionAgent
from agents.crisis_classifier import CrisisClassifierAgent
from agents.severity_prediction import SeverityPredictionAgent
from agents.resource_allocator import ResourceAllocatorAgent
from agents.action_simulator import ActionSimulatorAgent
from agents.notifier import NotifierAgent
from agents.verification import VerificationAgent

class MasterOrchestrator:
    def __init__(self):
        self.signal_fusion_agent = SignalFusionAgent()
        self.crisis_classifier_agent = CrisisClassifierAgent()
        self.severity_prediction_agent = SeverityPredictionAgent()
        self.resource_allocator_agent = ResourceAllocatorAgent()
        self.action_simulator_agent = ActionSimulatorAgent()
        self.notifier_agent = NotifierAgent()
        self.verification_agent = VerificationAgent()
        
        self.traces = {}

    def run_crisis_orchestration(self, signals: List[Dict[str, Any]], available_resources: Dict[str, Any]) -> Dict[str, Any]:
        root_execution_id = str(uuid.uuid4())
        print(f"--- Starting CIRO Orchestration (Root ID: {root_execution_id}) ---")
        
        # 1. Signal Fusion
        print("[1] Signal Fusion Agent running...")
        fusion_output = self.signal_fusion_agent.execute(signals, parent_execution_id=root_execution_id)
        self.traces["signal_fusion"] = fusion_output
        sf_exec_id = fusion_output.get("execution_metadata", {}).get("execution_id")
        
        # 2. Crisis Classification
        print("[2] Crisis Classifier Agent running...")
        classification_output = self.crisis_classifier_agent.execute(fusion_output, parent_execution_id=sf_exec_id)
        self.traces["classification"] = classification_output
        cc_exec_id = classification_output.get("execution_metadata", {}).get("execution_id")
        
        # 3. Severity Prediction
        print("[3] Severity Prediction Agent running...")
        prediction_output = self.severity_prediction_agent.execute(classification_output, parent_execution_id=cc_exec_id)
        self.traces["prediction"] = prediction_output
        sp_exec_id = prediction_output.get("execution_metadata", {}).get("execution_id")
        
        # 4. Resource Allocation
        print("[4] Resource Allocator Agent running...")
        ra_input = {
            "classification": classification_output,
            "prediction": prediction_output,
            "available_resources": available_resources
        }
        allocation_output = self.resource_allocator_agent.execute(ra_input, parent_execution_id=sp_exec_id)
        self.traces["allocation"] = allocation_output
        ra_exec_id = allocation_output.get("execution_metadata", {}).get("execution_id")
        
        # 5. Action Simulation
        print("[5] Action Simulator Agent running...")
        as_input = {
            "allocation_plan": allocation_output,
            "severity_prediction": prediction_output
        }
        simulation_output = self.action_simulator_agent.execute(as_input, parent_execution_id=ra_exec_id)
        self.traces["simulation"] = simulation_output
        as_exec_id = simulation_output.get("execution_metadata", {}).get("execution_id")
        
        # 6. Notification
        print("[6] Notifier Agent running...")
        notif_input = {
            "classification": classification_output,
            "severity_prediction": prediction_output,
            "simulation": simulation_output
        }
        notification_output = self.notifier_agent.execute(notif_input, parent_execution_id=as_exec_id)
        self.traces["notification"] = notification_output
        
        print("--- CIRO Orchestration Complete ---")
        self.traces["root_execution_id"] = root_execution_id
        return self.traces

    def run_verification(self, initial_traces: Dict[str, Any], new_signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        parent_exec_id = initial_traces.get("notification", {}).get("execution_metadata", {}).get("execution_id")
        print(f"--- Starting CIRO Verification & Recovery (Parent ID: {parent_exec_id}) ---")
        print("[7] Verification Agent running...")
        
        verification_output = self.verification_agent.execute(initial_traces, new_signals, parent_execution_id=parent_exec_id)
        self.traces["verification"] = verification_output
        return verification_output

if __name__ == "__main__":
    # Small test
    print("Orchestrator loaded successfully.")
