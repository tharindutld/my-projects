@echo off
title Mobile Store Launcher
echo ===================================================
echo   Starting Mobile Phone Sales Shop System (MERN)   
echo ===================================================
echo.

echo [1/2] Starting Node.js Backend Server on Port 5000...
start cmd /k "cd backend && npm run dev"

echo [2/2] Starting React Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both servers launched! Keep command screens open.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ===================================================
echo.
pause
