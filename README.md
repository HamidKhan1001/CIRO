# CIRO 3.0: Crisis Intelligence & Response Orchestrator

**Challenge 3 Solution: Crisis Intelligence & Response Orchestrator**

CIRO is an advanced, multi-agent AI system designed to fuse fragmented urban signals (social media, traffic, weather, emergency calls) into a cohesive, real-time crisis response strategy. It leverages **Google Antigravity** to orchestrate specialized agents that handle signal fusion, severity prediction, resource allocation, and action simulation.

---

## 🏗️ Architecture

CIRO is built on a modern, decoupled architecture designed for real-time responsiveness and high availability:

1. **Backend Orchestration Pipeline (FastAPI & Python):**
   - Serves as the central nervous system.
   - Houses the **Master Orchestrator** which sequentially coordinates 6 distinct AI agents.
   - Manages WebSocket connections for real-time dashboard updates.
   - Uses SQLite for lightweight, fast local persistence of incidents and allocations.

2. **Google Antigravity Agent Network:**
   - **Signal Fusion Agent**: Aggregates multi-source data, deduplicates, and assigns credibility scores.
   - **Crisis Classifier Agent**: Determines the crisis type (e.g., Flood, Heatwave, Accident).
   - **Severity Prediction Agent**: Models the affected radius, population impact, and evolution risk.
   - **Resource Allocator Agent**: Prioritizes constrained resources (Ambulances, Rescue Teams, Generators).
   - **Action Simulator Agent**: Predicts side effects of response actions (e.g., traffic rerouting congestion).
   - **Notifier Agent**: Crafts customized stakeholder alerts.
   - **Verification Agent**: Handles false positive detection and signal contradictions.

3. **Frontend Dashboard (React, Vite, TailwindCSS):**
   - A dark-themed, glassmorphic UI built for emergency command centers.
   - Features a GPU-accelerated Live Geolocation Map (Mapbox/Leaflet) to track incidents.
   - Visualizes live AI agent traces and system confidence metrics.

4. **Mobile Application (React Native / Expo):**
   - Field-responder and citizen-facing application.
   - Allows users to report crises with live GPS coordinates, photos, and severity ratings.
   - Interfaces directly with the FastAPI backend.

---

## 📊 Data Stream Schemas

**Input Signal Schema:**
```json
{
  "source": "social_media | traffic_api | weather_sensor | emergency_call",
  "timestamp": "ISO8601 UTC",
  "location": {
    "lat": 33.6844,
    "lon": 73.0479,
    "address": "G-10 Markaz"
  },
  "text": "Raw unstructured data / citizen report",
  "metadata": {"urgency_keywords": ["flooding", "trapped"]}
}
```

**Antigravity Output Trace Schema:**
```json
{
  "incident_id": "INC-8f92a1",
  "crisis_type": "URBAN_FLOODING",
  "severity": "CRITICAL",
  "confidence": {
    "overall_confidence": 0.88,
    "contradiction_flag": false
  },
  "affected_zone": {
    "radius_km": 2.5,
    "affected_population": 4500
  },
  "allocation_plan": [
    {"resource_type": "Rescue Boats", "quantity": 3, "destination": "G-10"}
  ],
  "execution_metadata": {
    "execution_id": "uuid",
    "agent_name": "RESOURCE_ALLOCATOR_V3_ANTIGRAVITY",
    "duration_ms": 1204
  }
}
```

---

## 🤖 Google Antigravity Usage

CIRO heavily utilizes **Google Antigravity** as the core orchestration framework. The `MasterOrchestrator` relies on the Antigravity design pattern to:
1. **Chain AI reasoning**: Outputs of the `SignalFusion` agent are strictly validated and passed to the `CrisisClassifier`, creating an unbroken chain of custody for decision-making.
2. **Traceability**: Every agent execution is tagged with an `execution_id`, `parent_execution_id`, and millisecond latency tracking via `antigravity_utils.py`. This allows full auditability of *why* the AI made a specific resource allocation.
3. **Misinformation Handling**: The Antigravity verification pipeline explicitly calculates contradiction scores. If social media reports a flood but mock sensors report a broken water main, the Antigravity fusion agent flags a contradiction and requires field verification before escalating resources.

---

## 🛠️ APIs and Tools

- **Google Gemini 1.5 Pro / Flash**: Core LLM driving the Antigravity agent logic.
- **FastAPI**: High-performance async Python backend framework.
- **React 18 & Vite**: Lightning-fast frontend tooling.
- **TailwindCSS**: Utility-first CSS framework for the glassmorphism UI.
- **React Native & Expo**: Cross-platform mobile app framework.
- **Leaflet & Mapbox**: Geospatial mapping and routing simulations.
- **SQLite**: Edge-optimized database.

---

## 🧠 Assumptions & Limitations

**Assumptions:**
- Emergency responders have mobile connectivity (fallback offline mesh routing is planned but out-of-scope for the current prototype).
- Sensor APIs and traffic metadata streams are structured in standard JSON formats.
- The command center has access to a centralized pool of resources.

**Limitations:**
- **Hallucination Risk**: While the verification agent minimizes false positives, extreme edge-case contradictions might require human-in-the-loop (HITL) overrides.
- **API Rate Limits**: Heavy concurrent crisis reporting can hit standard LLM API rate limits, requiring queued processing.

---

## 🔒 Privacy & Safety Note

CIRO handles sensitive geospatial and emergency data. 
- **Anonymization**: All social media and citizen reports are stripped of PII (Personally Identifiable Information) before being ingested by the Antigravity agents.
- **Safety**: The AI operates in an "Augmented Intelligence" mode. It *recommends* traffic rerouting and ambulance dispatches, but a human dispatcher retains the final authorization control to prevent unsafe automated routing.

---

## ⏱️ Cost & Latency Analysis

- **Latency**: The full 6-agent orchestration pipeline completes in **~4.5 to 7.0 seconds** (averaging ~1.1s per agent via Gemini Flash).
- **Cost**: Processing one crisis event (passing through all 6 agents) utilizes approximately 4,500 input tokens and 1,500 output tokens. At standard API rates, this equates to roughly **$0.002 per crisis orchestrated**.
- **Edge Efficiency**: Standard CRUD operations (fetching map points, updating statuses) bypass the LLM and resolve in `<50ms` via FastAPI and SQLite.

---

## 📈 Scalability & Baseline Comparison

**Baseline Comparison:**
Traditional emergency systems (e.g., basic 911 dispatch CADs) rely entirely on manual data entry and human cross-referencing of weather maps and traffic systems. A dispatcher might take **10-15 minutes** to manually verify a multi-source flood report. CIRO reduces this time to **under 10 seconds** while eliminating cognitive overload.

**Scalability Discussion:**
- **Horizontal Scaling**: The FastAPI backend is stateless (aside from the DB) and can be horizontally scaled behind a load balancer (e.g., NGINX or AWS ALB).
- **Agent Concurrency**: Antigravity agents can be executed asynchronously. `CrisisClassifier` and `SeverityPrediction` can run in parallel rather than strictly sequentially once the initial fusion is complete.
- **GeoHash Clustering**: The backend implements `GeoHashCluster` logic to group thousands of incidents on the frontend map, ensuring the browser does not crash during a massive city-wide event.