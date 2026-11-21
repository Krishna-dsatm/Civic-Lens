@echo off
title CivicLens - AI Triage for Citizen Complaints
echo ======================================================================
echo          CivicLens -- AI Triage for Citizen Complaints
echo ======================================================================
echo.

:: Add portable node to PATH if available in workspace
if exist "%~dp0\.tools\node\node.exe" (
    set "PATH=%~dp0\.tools\node;%PATH%"
)

:: Verify node
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH or .tools directory.
    echo Please install Node.js 18+ or run the bundled portable environment.
    pause
    exit /b 1
)

echo [1/2] Starting CivicLens Full-Stack Application on http://localhost:5000...
echo.
echo Citizen Portal   : http://localhost:5000
echo Admin Dashboard  : http://localhost:5000 (Switch tab to Admin)
echo API Health Check : http://localhost:5000/api/health
echo.
echo Press Ctrl+C anytime to stop the server.
echo ======================================================================

:: Launch browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

:: Start Node server
node backend\server.js
pause
