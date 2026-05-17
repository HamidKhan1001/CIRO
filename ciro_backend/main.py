from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from orchestrator import MasterOrchestrator
from database.db_setup import init_db, DB_PATH
import sqlite3
import json
import os
from fastapi import WebSocket, WebSocketDisconnect, status
from websocket_manager import manager
from utils.geohash_cluster import GeoHashCluster

# Initialize Database
init_db()

app = FastAPI(title="CIRO: Crisis Intelligence & Response Orchestrator")

# Allow the dashboard (served from browser) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = MasterOrchestrator()

# ---- REQUEST MODEL ----
class OrchestrationRequest(BaseModel):
    signals: List[Dict[str, Any]]
    resources: Dict[str, Any]

# ---- ROUTES ----
@app.get("/")
async def root():
    return {"status": "CIRO Backend is running", "version": "1.0.0"}

@app.get("/dashboard", include_in_schema=False)
async def serve_dashboard():
    return FileResponse(os.path.join("static", "index.html"))

@app.post("/orchestrate")
async def orchestrate_crisis(request: OrchestrationRequest):
    print(f"DEBUG: Received orchestration request with {len(request.signals)} signals")
    try:
        # 1. Run the AI Orchestration
        print("DEBUG: Calling orchestrator.run_crisis_orchestration")
        result = orchestrator.run_crisis_orchestration(request.signals, request.resources)
        print("DEBUG: Orchestrator call complete")

        # 2. Extract key data for the database
        classification = result.get("classification", {})
        allocation_plan = result.get("allocation", {})
        if isinstance(allocation_plan, dict):
            first_alloc = allocation_plan.get("allocation_plan", [{}])
            first_alloc = first_alloc[0] if first_alloc else {}
        else:
            first_alloc = {}

        # 3. Save to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        incident_id = classification.get("incident_id", "INC-" + os.urandom(4).hex())

        # Try to get lat, lon, address from signals
        first_sig_loc = request.signals[0].get("location", {}) if request.signals else {}
        lat = first_sig_loc.get("lat", 0.0)
        lon = first_sig_loc.get("lon", 0.0)
        address = first_sig_loc.get("address", "")

        cursor.execute("""
            INSERT OR REPLACE INTO incidents (id, type, severity, confidence, affected_population, location_lat, location_lon, location_address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id,
            classification.get("crisis_type"),
            classification.get("severity"),
            classification.get("confidence", {}).get("overall_confidence"),
            classification.get("affected_zone", {}).get("affected_population"),
            lat,
            lon,
            address,
            "ACTIVE"
        ))

        for sig in request.signals:
            sig_id = "SIG-" + os.urandom(4).hex()
            cursor.execute(
                "INSERT INTO signals (id, incident_id, source, content) VALUES (?, ?, ?, ?)",
                (sig_id, incident_id, sig.get("source"), sig.get("text"))
            )

        # Handle v3 allocation plan (List of {resource_type, quantity, ...})
        alloc_list = allocation_plan.get("allocation_plan", [])
        for item in alloc_list:
            res_type = item.get("resource_type")
            qty = item.get("quantity")
            if res_type and qty and qty > 0:
                cursor.execute(
                    "INSERT INTO resource_allocations (id, incident_id, resource_type, quantity) VALUES (?, ?, ?, ?)",
                    ("RES-" + os.urandom(4).hex(), incident_id, res_type, qty)
                )

        conn.commit()
        conn.close()

        # Add incident_id to top level for convenience
        result["incident_id"] = incident_id
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/incidents")
async def get_incidents():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
    incidents = []
    for row in cursor.fetchall():
        inc = dict(row)
        # Rename id to incident_id for client-side consistency
        inc["incident_id"] = inc.pop("id")
        # Align type to crisis_type
        inc["crisis_type"] = inc.pop("type", "UNKNOWN")
        
        cursor.execute("SELECT resource_type, quantity FROM resource_allocations WHERE incident_id = ?", (inc["incident_id"],))
        inc["allocations"] = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("SELECT source, content FROM signals WHERE incident_id = ?", (inc["incident_id"],))
        inc["signals"] = [dict(r) for r in cursor.fetchall()]
        incidents.append(inc)
    
    conn.close()
    return incidents


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.websocket("/ws/incidents/{user_id}/{role}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, role: str):
    """
    WebSocket endpoint for real-time incident updates
    """
    if role not in ['admin', 'responder', 'viewer']:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, user_id, role)
    
    try:
        while True:
            data = await websocket.receive_json()
            if data.get('type') == 'subscribe_incident':
                incident_id = data.get('incident_id')
                if incident_id:
                    if incident_id not in manager.incident_subscribers:
                        manager.incident_subscribers[incident_id] = set()
                    manager.incident_subscribers[incident_id].add(user_id)
            elif data.get('type') == 'heartbeat':
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif data.get('type') == 'ping':
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await manager.disconnect(websocket, role)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, role)

@app.get("/api/incidents/clustered")
async def get_clustered_incidents(
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    zoom: int
):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE status = 'ACTIVE'")
    
    class DummyIncident:
        def __init__(self, row):
            self.id = row['id']
            self.crisis_type = row['type']
            self.severity = row['severity']
            self.affected_population = row['affected_population']
            self.lat = row['location_lat'] or 0.0
            self.lon = row['location_lon'] or 0.0
            
            if self.severity == 'CRITICAL': self.severity_numeric = 5
            elif self.severity == 'HIGH': self.severity_numeric = 4
            elif self.severity == 'MEDIUM': self.severity_numeric = 3
            elif self.severity == 'LOW': self.severity_numeric = 2
            else: self.severity_numeric = 1
            
    incidents = [DummyIncident(row) for row in cursor.fetchall()]
    conn.close()
    
    precision = min(8, max(4, zoom - 3))
    clusterer = GeoHashCluster(precision=precision)
    return clusterer.cluster_incidents((min_lat, min_lon, max_lat, max_lon), incidents)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
