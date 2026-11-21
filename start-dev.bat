@echo off
title CivicLens Development Environment
if exist "%~dp0\.tools\node\node.exe" (
    set "PATH=%~dp0\.tools\node;%PATH%"
)

echo Starting Backend API on http://localhost:5000...
start "CivicLens Backend" cmd /k "node backend\server.js"

echo Starting Frontend Vite Dev Server on http://localhost:3000...
cd frontend
start "CivicLens Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:3000
