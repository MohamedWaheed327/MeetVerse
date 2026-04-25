@echo off
setlocal

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5279 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

cd /d MeetVerseBackend\MeetVerse.Api
start /B cmd /c "dotnet restore && dotnet build && dotnet run"

cd /d ..\..\MeetVerseFrontend
start /B cmd /c "npm run dev"

REM timeout /t 6 >nul
start "" "http://localhost:5173"

endlocal