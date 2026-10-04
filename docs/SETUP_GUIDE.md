# NOVARA | Antarctic Digital Twin - Setup & Installation Guide

**Product:** NOVARA | Antarctic Digital Twin  
**Operating System:** Windows, Linux, or macOS  

---

## 1. Prerequisites

Before running the application, ensure the following are installed:
- **Python 3.10+** (Python 3.14 verified)
- **Node.js 18+** & **npm**
- **Git** (optional)

---

## 2. Quick Start (Windows Batch Scripts)

For convenience, two batch files are provided in the repository root:

1. **Start Backend**: Double-click `run_backend.bat` or run in terminal:
   ```cmd
   run_backend.bat
   ```
   *Starts FastAPI backend server on `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

2. **Start Frontend**: Double-click `run_frontend.bat` or run in terminal:
   ```cmd
   run_frontend.bat
   ```
   *Starts Vite development server on `http://localhost:3000`.*

---

## 3. Manual Step-by-Step Setup

### Step A: Backend Setup
1. Navigate to the project root:
   ```bash
   cd C:\Users\ammul\Downloads\SIHPS60
   ```
2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn pydantic scipy numpy
   ```
3. Run the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Verify backend health in browser or terminal:
   ```bash
   curl http://localhost:8000/health
   ```

### Step B: Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd C:\Users\ammul\Downloads\SIHPS60\frontend-first-build-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev -- --port 3000
   ```
4. Open `http://localhost:3000` in your web browser.

---

## 4. Environment Variables

### Backend Configuration
Create an optional `.env` file in `C:\Users\ammul\Downloads\SIHPS60`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port for the FastAPI server |
| `HOST` | `0.0.0.0` | Listen host |
| `DB_PATH` | `polar_ops.db` | SQLite database path (WAL mode enabled) |

### Frontend Configuration
Create an optional `.env` file in `C:\Users\ammul\Downloads\SIHPS60\frontend-first-build-main`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## 5. Verification & Testing

### Run Backend API Tests:
```bash
cd C:\Users\ammul\Downloads\SIHPS60
python backend/tests/verify_live_api.py
```

### Run Frontend Tests:
```bash
cd C:\Users\ammul\Downloads\SIHPS60\frontend-first-build-main
npm run test
```

### Build Frontend for Production:
```bash
npm run build
```
