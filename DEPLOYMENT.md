# 🚀 CIRO 3.0: Manual Deployment Guide

This guide provides step-by-step instructions to manually deploy **CIRO 3.0** with absolute ease.

- **Backend (FastAPI + SQLite + Gemini):** Deployed to **Google Cloud Run** using the browser-based **Google Cloud Shell** (no local installations needed!).
- **Frontend (Vite + React + Tailwind):** Deployed to **Vercel** via terminal or browser import.

---

## ☁️ 1. Backend Deployment via Google Cloud Shell (Browser)

Google Cloud Shell is a free, pre-configured development environment in the browser with `gcloud`, `git`, and `docker` pre-installed.

### 🚀 Step-by-Step Deploy:
1. **Open Google Cloud Shell:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Click the **Activate Cloud Shell** button `[>_]` in the top right header bar of the console.

2. **Clone your GitHub Repository inside the Cloud Shell:**
   ```bash
   git clone https://github.com/HamidKhan1001/CIRO.git
   cd CIRO/ciro_backend
   ```

3. **Select/Set your GCP Project:**
   ```bash
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```

4. **Deploy directly to Cloud Run:**
   Cloud Build will automatically package your code using the provided `Dockerfile` and deploy it to a highly scalable Cloud Run instance.
   ```bash
   gcloud run deploy ciro-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_gemini_api_key_here"
   ```
   *Note: If prompted to enable required APIs, press `y` to approve.*

5. **Copy the Service URL:**
   Once completed, Google Cloud will output a Service URL (e.g., `https://ciro-backend-xxxxxx-uc.a.run.app`). **Copy this URL** for the frontend setup.

---

## ⚛️ 2. Frontend Deployment (Vercel)

Vercel is the easiest and highest performance host for Vite React SPAs.

### Option A: Using the Vercel Dashboard (Browser - Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Import your GitHub repository: `HamidKhan1001/CIRO`.
3. Set the **Root Directory** to `ciro_frontend`.
4. In **Environment Variables**, add these key-value pairs:
   * **Key:** `VITE_API_URL`
     * **Value:** `https://ciro-backend-xxxxxx-uc.a.run.app` (your Google Cloud Run URL)
   * **Key:** `VITE_MAPBOX_TOKEN`
     * **Value:** (your Mapbox Public token starting with `pk.eyJ1...`)
5. Click **Deploy**! Vercel handles all routing dynamically using the `vercel.json` SPA configuration we set up.

---

## ⚡ 3. Verification & Architecture Notes

- **Real-Time Integration:** The Vercel frontend automatically connects with the Cloud Run backend for both incidents (`/report`) and the AI chat (`/chat`).
- **Dynamic CORS:** FastAPI is pre-configured to allow connections from any origin, meaning your Vercel deployment will immediately function without CORS restrictions.
