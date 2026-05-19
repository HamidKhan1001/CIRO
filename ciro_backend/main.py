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

import time

# Simple in-memory cache to replace Redis for hackathon
cluster_cache = {}

@app.get("/api/incidents/clustered")
async def get_clustered_incidents(
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    zoom: int
):
    cache_key = f"incidents:{min_lat}:{min_lon}:{max_lat}:{max_lon}:{zoom}"
    
    # Check cache first
    now = time.time()
    if cache_key in cluster_cache:
        cached_data, expires_at = cluster_cache[cache_key]
        if now < expires_at:
            return cached_data
            
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
    result = clusterer.cluster_incidents((min_lat, min_lon, max_lat, max_lon), incidents)
    
    # Cache with TTL based on zoom level
    ttl = 120
    if zoom < 10:
        ttl = 300 # 5 minutes
    elif zoom <= 14:
        ttl = 60  # 1 minute
    else:
        ttl = 30  # 30 seconds
        
    cluster_cache[cache_key] = (result, now + ttl)
    
    # Simple cache cleanup to prevent memory leaks during prolonged use
    if len(cluster_cache) > 1000:
        keys_to_delete = [k for k, v in cluster_cache.items() if v[1] < now]
        for k in keys_to_delete:
            del cluster_cache[k]
            
    return result


class QuickReportRequest(BaseModel):
    crisis_type: str
    severity: str
    description: str
    location: Optional[Dict[str, Any]] = None

@app.post("/report")
async def quick_report(request: QuickReportRequest):
    """
    Direct citizen incident report — bypasses AI pipeline for instant submission.
    Saves to DB immediately, visible in admin panel within 10 seconds.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    incident_id = "RPT-" + os.urandom(4).hex().upper()
    lat  = request.location.get("lat", 0.0)  if request.location else 0.0
    lng  = request.location.get("lng", 0.0)  if request.location else 0.0
    address = f"GPS: {lat:.5f}, {lng:.5f}" if lat else "Unknown location"

    cursor.execute("""
        INSERT INTO incidents (id, type, severity, confidence, affected_population, location_lat, location_lon, location_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (incident_id, request.crisis_type, request.severity, 0.75, 0, lat, lng, address, "ACTIVE"))

    sig_id = "SIG-" + os.urandom(4).hex().upper()
    cursor.execute(
        "INSERT INTO signals (id, incident_id, source, content, credibility) VALUES (?, ?, ?, ?, ?)",
        (sig_id, incident_id, "citizen_report", request.description, 0.75)
    )

    conn.commit()
    conn.close()

    return {"incident_id": incident_id, "status": "ACTIVE", "message": "Incident reported and visible in Admin Command Center"}



class ChatRequest(BaseModel):
    message: str
    location: Optional[Dict[str, Any]] = None
    context: Optional[str] = None

@app.post("/chat")
async def chat_with_ciro(request: ChatRequest):
    """AI chat assistant for citizens and field responders."""
    from utils.gemini_client import generate_json_response

    system_prompt = """You are CIRO, a calm, professional Crisis Intelligence AI assistant embedded in an emergency response platform.
Your role is to help citizens and field responders during urban crises: flooding, heatwaves, accidents, power outages, etc.

Rules:
- Be concise, reassuring, and action-oriented. Never panic the user.
- If the user reports an emergency, acknowledge it clearly and provide immediate steps.
- Always return valid JSON only. No markdown, no extra text.

Output format (strict JSON):
{
  "response": "Your clear, helpful message to the user (1-3 sentences max)",
  "suggestions": ["Short action 1", "Short action 2", "Short action 3"],
  "severity": "safe | caution | danger",
  "escalate": false
}

severity guide: safe=no immediate threat, caution=user should be alert, danger=active emergency detected.
escalate=true only if the user is reporting an active life-threatening situation requiring immediate dispatch."""

    location_ctx = ""
    if request.location:
        location_ctx = f"User GPS: lat={request.location.get('lat')}, lng={request.location.get('lng')}. "

    context_ctx = f"Recent context: {request.context}. " if request.context else ""
    prompt = f"{location_ctx}{context_ctx}User says: {request.message}"

    try:
        response_text = generate_json_response(prompt, system_prompt)
        result = json.loads(response_text)
    except json.JSONDecodeError:
        result = {
            "response": "I'm having trouble connecting to the AI. Please call emergency services directly if this is urgent.",
            "suggestions": ["Call 15 (Police)", "Call 1122 (Ambulance)", "Call 16 (Fire)"],
            "severity": "caution",
            "escalate": False
        }
    except Exception as e:
        result = {
            "response": "CIRO AI is temporarily unavailable. Stay calm and contact your local emergency services.",
            "suggestions": ["Call 15 (Police)", "Call 1122 (Ambulance)", "Move to higher ground if flooding"],
            "severity": "caution",
            "escalate": False
        }

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
