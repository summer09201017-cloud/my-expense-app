@echo off
title Expense Tracker - Local Launcher
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing dependencies for the first time...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)

:menu
cls
echo ====================================
echo    Expense Tracker - Launcher
echo ====================================
echo  1. Dev mode  (HMR, port 5173)
echo  2. Prod mode (build + preview, port 4173)
echo  3. Build only (output to dist\)
echo  4. Reinstall dependencies
echo  5. Exit
echo ====================================
set /p choice=Choose (1-5):

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto preview
if "%choice%"=="3" goto build
if "%choice%"=="4" goto reinstall
if "%choice%"=="5" exit /b 0
goto menu

:dev
echo Starting dev server... (Ctrl+C to stop)
start "" http://localhost:5173
call npm run dev
pause
goto menu

:preview
echo Building production bundle...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto menu
)
echo Starting preview server... (Ctrl+C to stop)
start "" http://localhost:4173
call npm run preview
pause
goto menu

:build
call npm run build
echo.
echo Build complete. Output in dist\
pause
goto menu

:reinstall
echo Removing node_modules and reinstalling...
if exist "node_modules\" rmdir /s /q node_modules
call npm install
pause
goto menu
