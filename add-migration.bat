@echo off
cd /d "%~dp0"

set /p MIGRATION_NAME=Enter migration name: 

if "%MIGRATION_NAME%"=="" (
    echo Migration name cannot be empty.
    pause
    exit /b
)

echo.
echo Adding migration...
dotnet ef migrations add %MIGRATION_NAME% ^
  --project ".\MeetVerseBackend\MeetVerse.Api" ^
  --startup-project ".\MeetVerseBackend\MeetVerse.Api" ^
  --context "MeetVerseDbContext" ^
  --output-dir "Database\MigrationsEfCore"

if errorlevel 1 (
    echo Failed to add migration.
    pause
    exit /b
)

echo.
echo Updating database...
dotnet ef database update ^
  --project ".\MeetVerseBackend\MeetVerse.Api" ^
  --startup-project ".\MeetVerseBackend\MeetVerse.Api" ^
  --context "MeetVerseDbContext"

if errorlevel 1 (
    echo Failed to update database.
    pause
    exit /b
)

echo.
echo Migration added and database updated successfully.
pause