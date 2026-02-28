@echo off
chcp 65001 > nul
title Make Deploy Package

echo.
echo  ================================
echo   Preparing deploy package...
echo  ================================
echo.

set DEPLOY_DIR=%~dp0deploy

:: Clean existing deploy folder
if exist "%DEPLOY_DIR%" (
  echo  [Clean] Removing old deploy folder...
  rmdir /s /q "%DEPLOY_DIR%"
)
mkdir "%DEPLOY_DIR%"

:: Build React app
echo  [Build] Building React app...
cd "%~dp0client"
call npm run build
if errorlevel 1 (
  echo.
  echo  ERROR: Build failed. Please check the error above.
  pause
  exit /b 1
)
cd "%~dp0"

:: Copy files
echo  [Copy] Copying files...

xcopy /e /i /y /q "client\dist" "%DEPLOY_DIR%\client\dist\" > nul 2>&1

:: Copy chapter JSON files only (learning.db is NOT copied -- each device has own progress)
mkdir "%DEPLOY_DIR%\data" 2>nul
for %%f in ("data\chapter_*.json") do copy /y "%%f" "%DEPLOY_DIR%\data\" > nul

mkdir "%DEPLOY_DIR%\server"
copy /y "server\index.js"     "%DEPLOY_DIR%\server\index.js"     > nul
copy /y "server\db.js"        "%DEPLOY_DIR%\server\db.js"        > nul
copy /y "server\package.json" "%DEPLOY_DIR%\server\package.json" > nul

if exist "server\.env" (
  copy /y "server\.env" "%DEPLOY_DIR%\server\.env" > nul
  echo  [OK] .env copied
) else (
  echo  [WARN] server\.env not found. Creating template...
  echo GOOGLE_TTS_API_KEY=ENTER_YOUR_KEY_HERE > "%DEPLOY_DIR%\server\.env"
  echo PORT=3001                              >> "%DEPLOY_DIR%\server\.env"
)

copy /y "start.bat" "%DEPLOY_DIR%\start.bat" > nul 2>&1

echo.
echo  ================================
echo   Done!
echo  ================================
echo.
echo   Deploy folder: %DEPLOY_DIR%
echo.
echo   Copy this folder to the target laptop.
echo   (Node.js must be installed)
echo.
echo   On target laptop: double-click start.bat
echo.

explorer "%DEPLOY_DIR%"
pause
