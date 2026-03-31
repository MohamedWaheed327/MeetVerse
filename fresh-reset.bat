@echo off
cd /d "%~dp0"

echo ==========================================
echo   EF Core FULL RESET - MeetVerse
echo ==========================================
echo.
echo This will:
echo   1. Delete EF Core migrations
echo   2. Drop the database
echo   3. Create a fresh InitialCreate migration
echo   4. Recreate the database
echo.
set /p CONFIRM=Type YES to continue: 

if /I not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b
)

echo.
echo Deleting old EF Core migrations...
if exist ".\MeetVerseBackend\MeetVerse.Api\Database\MigrationsEfCore" (
    del /q ".\MeetVerseBackend\MeetVerse.Api\Database\MigrationsEfCore\*.*"
)

echo.
echo Dropping database...
dotnet ef database drop --force ^
  --project ".\MeetVerseBackend\MeetVerse.Api" ^
  --startup-project ".\MeetVerseBackend\MeetVerse.Api" ^
  --context "MeetVerseDbContext"

if errorlevel 1 (
    echo Failed to drop database.
    pause
    exit /b
)

echo.
echo Creating fresh initial migration...
dotnet ef migrations add InitialCreate ^
  --project ".\MeetVerseBackend\MeetVerse.Api" ^
  --startup-project ".\MeetVerseBackend\MeetVerse.Api" ^
  --context "MeetVerseDbContext" ^
  --output-dir "Database\MigrationsEfCore"

if errorlevel 1 (
    echo Failed to create initial migration.
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
echo Fresh reset completed successfully.
pause