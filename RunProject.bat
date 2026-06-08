@echo off
setlocal

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5279 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

cd /d MeetVerseBackend
start /B cmd /c "dotnet restore MeetVerseBack.sln && dotnet build MeetVerseBack.sln && dotnet run --project MeetVerse.Web"

cd /d ..\MeetVerseFrontend
start /B cmd /c "npm run dev"

REM timeout /t 6 >nul
start "" "http://localhost:5173"

endlocal