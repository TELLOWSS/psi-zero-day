@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later must be installed first.
  pause
  exit /b 1
)
start "SIGNAL BREAKER local server" cmd /k node "%~dp0dev-preview.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5199/"
