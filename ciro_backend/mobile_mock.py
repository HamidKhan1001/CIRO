import json
import sqlite3
import os
import datetime

# Mock of the local SQLite database on the mobile app
DB_PATH = os.path.join(os.path.dirname(__file__), "ciro_local.db")

def init_local_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS message_queue (
        id TEXT PRIMARY KEY,
        content TEXT,
        status TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()

class MobileAppMock:
    def __init__(self):
        init_local_db()

    def detect_crisis_local(self, signal: dict) -> dict:
        """
        Simulate the Local Decision Engine (Cached Models).
        In a real app, this would use TFLite. Here we use a heuristic.
        """
        print(f"[Mobile] Offline detection running on signal: {signal['text']}")
        
        # Simple heuristic rule
        is_fire = "fire" in signal['text'].lower() or "smoke" in signal['text'].lower()
        crisis_type = "FIRE" if is_fire else "UNKNOWN"
        confidence = 0.78 if is_fire else 0.50
        
        decision = {
            "incident_id": "INC_LOCAL_" + str(int(datetime.datetime.now().timestamp())),
            "crisis_type": crisis_type,
            "severity": "HIGH",
            "confidence": confidence,
            "affected_population": 2000,
            "basis": f"Local rule-based heuristic (offline). Signal text: {signal['text']}"
        }
        return decision

    def queue_for_mesh_relay(self, decision: dict):
        """
        Simulate queueing message for Bluetooth Ad-Hoc Mesh Relay.
        """
        message_id = "offline_" + str(int(datetime.datetime.now().timestamp()))
        print(f"[Mobile] Queueing decision for mesh relay. ID: {message_id}")
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO message_queue (id, content, status) VALUES (?, ?, 'pending_sync')",
            (message_id, json.dumps(decision))
        )
        conn.commit()
        conn.close()
        
        print(f"[Mobile] Message relayed via Bluetooth (mock). Status: pending_sync")
        return message_id

    def sync_on_reconnection(self, orchestrator) -> list:
        """
        Simulate reconnection: fetch pending messages, send to cloud orchestrator, update status.
        """
        print("[Mobile] Connection Restored! Syncing with Cloud Orchestrator...")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, content FROM message_queue WHERE status = 'pending_sync'")
        pending_messages = cursor.fetchall()
        
        results = []
        for msg_id, content in pending_messages:
            decision = json.loads(content)
            
            # Send to cloud orchestrator (simulated by directly calling the agent)
            # In a real system, this would be an API call to FastAPI.
            print(f"[Mobile->Cloud] Uploading decision {msg_id}...")
            
            # Cloud verification step
            mock_new_signals = [{"text": "Drone feed confirms fire east of factory.", "source": "drone", "credibility": 0.95}]
            
            # Convert decision into the format expected by verification agent
            initial_data = {"type": decision["crisis_type"], "confidence": decision["confidence"]}
            
            cloud_response = orchestrator.run_verification({"classification": initial_data}, mock_new_signals)
            
            # Update local status
            cursor.execute("UPDATE message_queue SET status = 'synced' WHERE id = ?", (msg_id,))
            print(f"[Mobile] Message {msg_id} status updated to 'synced'.")
            results.append(cloud_response)

        conn.commit()
        conn.close()
        return results

if __name__ == "__main__":
    from orchestrator import MasterOrchestrator
    
    app = MobileAppMock()
    
    # Simulate an offline incident
    offline_signal = {
        "type": "emergency_call",
        "text": "Caller reports heavy smoke from factory near industrial area, traffic stopped",
        "timestamp": "2024-05-14T14:05:00Z",
        "location": "industrial_zone_peshawar"
    }
    
    decision = app.detect_crisis_local(offline_signal)
    app.queue_for_mesh_relay(decision)
    
    print("\n--- Time passes. Police motorcycle relays message. Reconnects to cell tower. ---\n")
    
    cloud_orchestrator = MasterOrchestrator()
    cloud_responses = app.sync_on_reconnection(cloud_orchestrator)
    print("\n[Mobile] Received Cloud Responses:", json.dumps(cloud_responses, indent=2))
