@echo off
cd /d "%~dp0"
title Smart University Navigator

echo Starting backend...
start "Backend" cmd /k "npm run dev:backend"

echo Starting frontend...
start "Frontend" cmd /k "npm run dev:frontend"

echo Waiting for the servers to start...
timeout /t 8 /nobreak >nul

start http://localhost:5173
exit