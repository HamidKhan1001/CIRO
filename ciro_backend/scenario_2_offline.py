import os
from mobile_mock import MobileAppMock
from orchestrator import MasterOrchestrator

def run_scenario_2():
    print("======================================================")
    print(" SCENARIO 2: API Failure + Offline Resilience")
    print("======================================================\n")
    
    # Check if GEMINI_API_KEY is set
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY environment variable is not set.")
        print("Please set it in your terminal before running this script.")
        print("Example: $env:GEMINI_API_KEY='your_key'")
        return

    print("[Context] A crisis worker is in a 2G zone with no API connectivity.")
    
    app = MobileAppMock()
    
    # Simulate an offline incident signal
    offline_signal = {
        "type": "emergency_call",
        "text": "Caller reports heavy smoke from factory near industrial area, traffic stopped",
        "timestamp": "2024-05-14T14:05:00Z",
        "location": "industrial_zone_peshawar"
    }
    
    # Step 1: Local Decision Engine (Offline)
    print("\n--- STEP 1: LOCAL OFFLINE DECISION ---")
    decision = app.detect_crisis_local(offline_signal)
    
    # Step 2: Queue for Ad-Hoc Mesh Relay
    print("\n--- STEP 2: BLUETOOTH MESH RELAY ---")
    app.queue_for_mesh_relay(decision)
    
    print("\n[Time Passes] Police motorcycle relays message... Device reaches cell tower...")
    
    # Step 3: Sync on Reconnection
    print("\n--- STEP 3: CLOUD SYNC & VERIFICATION ---")
    cloud_orchestrator = MasterOrchestrator()
    cloud_responses = app.sync_on_reconnection(cloud_orchestrator)
    
    print("\n======================================================")
    print(" SCENARIO 2 COMPLETE.")
    print("======================================================")
    print("Cloud verification responses saved to traces. Review orchestrator output above.")

if __name__ == "__main__":
    run_scenario_2()
