# Deployment Guide: Render & Vercel

This guide outlines how to deploy the **NOVARA Antarctic Digital Twin** platform using **Render** (FastAPI backend) and **Vercel** (React/Vite/TanStack frontend).

---

## Architecture Overview

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│         Vercel (Frontend)       │                 │         Render (Backend)        │
│  NOVARA 3D Digital Twin UI      │  HTTPS Requests │  FastAPI Server (Python 3.11)   │
│  https://novara-app.vercel.app  │ ──────────────> │  https://novara.onrender.com    │
│  (Vite / React / Three.js)      │ <────────────── │  (Microgrid, Telemetry, Faults) │
└─────────────────────────────────┘   CORS Enabled  └─────────────────────────────────┘
```

---

## Part 1: Deploy Backend on Render

### Step 1: Create Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub / GitLab repository containing this project.

### Step 2: Configure Service Settings
- **Name**: `novara-backend` (or your choice)
- **Region**: `Oregon (US West)` or closest to your users
- **Root Directory**: Leave blank (uses repo root) OR `.`
- **Environment**: `Python 3`
- **Build Command**:
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port $PORT
  ```
- **Plan**: Free or Starter

*(Alternatively, if you use Render Blueprints, Render will automatically detect the included `render.yaml` file).*

### Step 3: Configure Environment Variables in Render
In the **Environment** tab of your Render service, add:
| Key | Value | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Ensures Python 3.11 runtime |
| `CORS_ORIGINS` | `*` (or your Vercel URL) | Allows Vercel frontend requests |
| `SIMULATION_MODE` | `true` | Identifies all data as mathematical simulation |
| `PORT` | `10000` | (Render sets this automatically) |

### Step 4: Verify Deployment
Once built, visit your Render URL:
- Health check: `https://<YOUR-RENDER-APP>.onrender.com/health` (should return `{"status": "healthy", ...}`)
- API Docs: `https://<YOUR-RENDER-APP>.onrender.com/docs` (Swagger UI)

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your Git repository.

### Step 2: Configure Build Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click *Edit* and select:
  ```
  frontend-first-build-main
  ```
  *(If deploying from root without changing Root Directory, the root `vercel.json` will automatically build the frontend).*
- **Build Command**: `npm run build`
- **Output Directory**: `.output/public`

### Step 3: Set Environment Variables in Vercel
Before clicking deploy, add the following environment variable:
| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<YOUR-RENDER-APP>.onrender.com` |

*(Make sure to use `https://` and do **not** include a trailing slash).*

### Step 4: Deploy
Click **Deploy**. Vercel will install dependencies, build the 3D twin bundles, and launch your site at `https://<YOUR-APP>.vercel.app`.

---

## Part 3: CORS Configuration & Verification

### How CORS is Configured
In `backend/main.py`:
1. `allow_origin_regex`: Automatically matches all `https://*.vercel.app` domains (including all preview/PR deployments) and `https://*.onrender.com`.
2. `CORS_ORIGINS`: Allows you to specify custom domains (e.g., `https://customdomain.com`).
3. `allow_credentials`: Enabled for secure cookie/auth support.
4. Preflight `OPTIONS` requests are handled automatically with HTTP 200 OK.

### Testing Connectivity
1. Open your deployed Vercel website in the browser.
2. Open Developer Tools (`F12`) > **Console**.
3. Trigger a simulation scenario (e.g. *Generator 1 Failure*).
4. Verify the network tab shows `POST /api/v1/simulation/maitri/fault` with status `200 OK` and response header:
   ```http
   access-control-allow-origin: https://<YOUR-APP>.vercel.app
   ```

---

## Troubleshooting

1. **Render Free Tier Spin-Down**:
   Render's free tier spins down services after 15 minutes of inactivity. The first request may take ~30-50 seconds to wake up. The frontend client includes resilient fallbacks so the 3D twin and UI remain responsive even if the backend is waking up.
2. **Mixed Content Warning**:
   Always make sure `VITE_API_URL` starts with `https://`. Browsers block HTTP requests from an HTTPS website.
3. **Custom Domain**:
   If you add a custom domain (e.g. `twin.moes.gov.in`), add it to Render's `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://twin.moes.gov.in,https://your-app.vercel.app
   ```
