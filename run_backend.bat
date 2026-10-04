@echo off
title NOVARA Backend Server (FastAPI)
echo ========================================================
echo   Starting NOVARA Antarctic Digital Twin Backend Server
echo   Host: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo   Mode: SIMULATION MODE
echo ========================================================
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
