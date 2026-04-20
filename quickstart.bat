@echo off
echo ==================================
echo   FoodFlow Quick Start Script
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo X Node.js is not installed. Please install it first.
    echo   Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version
echo ✓ npm found
npm --version
echo.

REM Setup backend
echo Setting up backend...
cd backend
call npm install
echo.

echo Initializing database...
call npm run init-db
echo.

REM Setup frontend
echo Setting up frontend...
cd ..\frontend
call npm install
echo.

echo ==================================
echo   Setup Complete!
echo ==================================
echo.
echo To start the application:
echo.
echo 1. Start Backend (in Command Prompt 1):
echo    cd backend
echo    npm run dev
echo.
echo 2. Start Frontend (in Command Prompt 2):
echo    cd frontend
echo    npm start
echo.
echo 3. Open http://localhost:3000
echo.
echo Demo Accounts:
echo   Admin    - admin/admin123
echo   Customer - customer1/admin123
echo.
echo ==================================
echo.
echo NOTE: Make sure PostgreSQL is installed and running!
echo       Create database manually: CREATE DATABASE foodflow_db;
echo.
pause
