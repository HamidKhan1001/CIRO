# 🚀 CIRO 3.0 Handover & Developer Guide

Welcome to **CIRO 3.0** (Crisis Intelligence & Response Orchestrator)! This document outlines everything you need to know to take over the project, configure your environments, and troubleshoot any performance or network bottlenecks.

---

## 🗺️ 1. Mapbox API Key Configuration

To enable the interactive GPU-accelerated **Live Geolocation Incident Map** on the desktop dashboard:

1. **Sign Up:** Create a free account at [mapbox.com/signup](https://www.mapbox.com/signup/). (You get 50,000 free map loads per month).
2. **Get Token:** Navigate to your account dashboard at [account.mapbox.com](https://account.mapbox.com/) and copy your **Default public token** (starts with `pk.eyJ1...`).
3. **Configure Environment:** Create a `.env` file directly under `ciro_frontend/` and add the token:
   ```env
   VITE_MAPBOX_TOKEN=your_copied_mapbox_token_here
   ```
4. *Note: If no token is provided, the dashboard is designed to gracefully render a warning overlay rather than crashing the React application.*

---

## 🚨 2. Troubleshooting: "Report Crisis is Hanging / Loading Indefinitely"

If the mobile app is hanging for minutes when reporting a crisis, **the backend process has stalled or deadlocked**. There are three highly probable causes for this during development:

### Cause A: Gemini API Key / Network Block (Most Likely)
* **What's happening:** The `/orchestrate` endpoint sequentially triggers 6 distinct AI agents, each of which makes a synchronous HTTP call to the Google Gemini API. 
* **The Blocker:** If your local network/Wi-Fi blocks Google/Gemini traffic, or if a VPN is disconnecting, or if the `GEMINI_API_KEY` in `ciro_backend/.env` is invalid/expired, the Python network socket may hang **indefinitely** without throwing a standard socket timeout.
* **How to fix:**
  1. Look at your backend terminal running `python main.py`. Check which agent it printed last (e.g., `[1] Signal Fusion Agent running...`).
  2. Verify that your machine has an active internet connection that can reach Google APIs.
  3. Verify the `GEMINI_API_KEY` inside `ciro_backend/.env` is active and correct.

### Cause B: SQLite Database File Lock
* **What's happening:** SQLite allows multiple reader threads, but only **one writer at a time**. If a database write operation fails to commit or leaves a connection open/active, the `ciro_cloud.db` file becomes hard-locked. Any subsequent write operation (such as submitting a new crisis) will wait indefinitely for the lock to release.
* **How to fix:**
  1. Completely stop the backend python server (Ctrl+C).
  2. Delete the locked local database file: `ciro_backend/database/ciro_cloud.db`.
  3. Restart the backend server (`python main.py`). The database schema will automatically recreate clean, healthy, and completely unlocked.

### Cause C: Mobile Network Mismatch
* **What's happening:** The mobile client base URL is configured to hit `http://192.168.100.93:8000`. If your computer's local LAN IP has changed, the mobile app will try to hit an inactive IP, hanging until the 4-second timeout limit triggers.
* **How to fix:**
  1. Check your computer's current Wi-Fi IP address (run `ipconfig` on Windows).
  2. If it is different from `192.168.100.93`, update `DEFAULT_BASE_URL` in `ciro_mobile/src/services/api.js` to match your new IP.

---

## 🏃 3. Run Commands for the Stack

Start each command in its respective folder:

### 1️⃣ Backend Server (FastAPI + SQLite)
```bash
cd ciro_backend
python main.py
```
*Runs on `http://localhost:8000` (and binds to `0.0.0.0` for LAN access).*

### 2️⃣ Desktop Frontend (Vite + React)
```bash
cd ciro_frontend
npm run dev
```
*Runs on `http://localhost:5173/`.*

### 3️⃣ Mobile Application (Expo + React Native)
```bash
cd ciro_mobile
npx expo start
```
*Scan the QR code via Expo Go to run on a physical device or emulator.*
