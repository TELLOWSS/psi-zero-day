@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later must be installed first.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5199/"
node "%~dp0dev-preview.mjs"
if errorlevel 1 pause