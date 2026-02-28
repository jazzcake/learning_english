@echo off
chcp 65001 > nul
title English Learning App

echo.
echo  ================================
echo   Starting English Learning App...
echo  ================================
echo.

:: Install server packages if missing
if not exist "server\node_modules" (
  echo  [Install] Installing server packages...
  cd server && npm install && cd ..
)

:: Check for .env
if not exist "server\.env" (
  echo.
  echo  ERROR: server\.env not found.
  echo        Please add your GOOGLE_TTS_API_KEY to server\.env
  echo.
  pause
  exit
)

echo  Starting server...
echo  Browser will open automatically.
echo.
echo  Close this window to stop the app.
echo.

:: Open browser after 2 seconds
start "" /b cmd /c "timeout /t 2 > nul && start http://localhost:3001"

:: Run server
cd server && node index.js
