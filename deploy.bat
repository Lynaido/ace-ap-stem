@echo off
REM AAS App Deployment Script for Windows

echo =========================================
echo AAS App - Deployment Build Script
echo =========================================
echo.

REM Check if .env.production exists
if not exist ".env.production" (
    echo ERROR: .env.production file not found!
    echo Please create .env.production from .env.production.example
    exit /b 1
)

if not exist "backend\.env.production" (
    echo ERROR: backend\.env.production file not found!
    echo Please create backend\.env.production from backend\.env.production.example
    exit /b 1
)

echo Step 1: Installing dependencies...
echo -----------------------------------
call npm install
cd backend
call npm install
cd ..

echo.
echo Step 2: Building frontend...
echo -----------------------------------
call npm run build

echo.
echo Step 3: Building backend...
echo -----------------------------------
cd backend
call npm run build
cd ..

echo.
echo Step 4: Running Prisma migrations...
echo -----------------------------------
cd backend
call npx prisma generate
cd ..

echo.
echo =========================================
echo Build completed successfully!
echo =========================================
echo.
echo Files ready for deployment:
echo   - Frontend: .\build\
echo   - Backend: .\backend\dist\
echo.
echo Next steps:
echo   1. Upload 'build' folder contents to your domain's public_html
echo   2. Upload 'backend' folder to a secure location (not public_html)
echo   3. Set up Node.js application in Hostinger control panel
echo   4. Configure environment variables in Hostinger
echo   5. Run database migrations on production
echo   6. Start the backend application
echo.
pause
