@echo off
title NOVARA Frontend Client (Vite + Three.js)
echo ========================================================
echo   Starting NOVARA Antarctic Digital Twin Frontend Client
echo   URL: http://localhost:3000
echo   Font: Plus Jakarta Sans
echo   Palette: Polar Mission Control
echo ========================================================
cd frontend-first-build-main
npm run dev -- --host --port 3000
pause
