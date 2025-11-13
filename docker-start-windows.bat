@echo off
REM Quick start script for Windows Docker setup
REM This is a simple batch file that can be double-clicked to start the Docker environment

echo ========================================
echo AAS Problem Solving Website
echo Starting Docker Environment...
echo ========================================
echo.

REM Check if docker-compose.windows.yml exists
if not exist "docker-compose.windows.yml" (
    echo Error: docker-compose.windows.yml not found!
    echo Please make sure you're in the correct directory.
    pause
    exit /b 1
)

REM Load environment variables from .env.docker
if exist ".env.docker" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env.docker") do (
        set %%a=%%b
    )
)

REM Start Docker containers
docker-compose -f docker-compose.windows.yml up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Docker containers started successfully!
    echo ========================================
    echo.
    echo Access the application at:
    echo   Frontend:  http://localhost:3000
    echo   Backend:   http://localhost:3001
    echo.
    echo To view logs, run:
    echo   docker-compose -f docker-compose.windows.yml logs -f
    echo.
    echo To stop services, run:
    echo   docker-compose -f docker-compose.windows.yml down
    echo.
) else (
    echo.
    echo Error starting Docker containers!
    echo Please check the error messages above.
    echo.
)

pause
