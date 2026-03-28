@echo off
setlocal

REM Kill anything using frontend/backend ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5279 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM Start backend minimized
start "MeetVerse Backend" /min cmd /c "cd /d MeetVerseBackend\MeetVerse.Api && dotnet restore && dotnet build && dotnet run"

REM Start frontend minimized
start "MeetVerse Frontend" /min cmd /c "cd /d MeetVerseFrontend && npm run dev"

REM Wait a bit for frontend to boot
timeout /t 6 >nul

REM Open browser
start "" "http://localhost:5173"

endlocal