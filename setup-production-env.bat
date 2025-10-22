@echo off
REM Production Environment Setup Script for Windows

echo =========================================
echo AAS App - Production Environment Setup
echo =========================================
echo.

REM Check if files already exist
if exist ".env.production" (
    echo WARNING: .env.production already exists!
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Setup cancelled.
        exit /b 1
    )
)

if exist "backend\.env.production" (
    echo WARNING: backend\.env.production already exists!
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Setup cancelled.
        exit /b 1
    )
)

echo Setting up Frontend environment...
echo.

set /p DOMAIN="Enter your production domain (e.g., yourdomain.com): "
set /p API_DOMAIN="Enter your API subdomain (e.g., api.yourdomain.com): "

(
echo # Frontend Production Environment Configuration
echo REACT_APP_API_URL=https://%API_DOMAIN%
echo REACT_APP_ENV=production
echo REACT_APP_VERSION=1.0.0
echo REACT_APP_ENABLE_ANALYTICS=true
echo REACT_APP_ENABLE_DEBUG_MODE=false
) > .env.production

echo Done: Frontend .env.production created
echo.

echo Setting up Backend environment...
echo.

set /p DB_HOST="Enter database host (from Hostinger): "
set /p DB_PORT="Enter database port (usually 5432): "
set /p DB_NAME="Enter database name: "
set /p DB_USER="Enter database username: "
set /p DB_PASS="Enter database password: "
set /p GOOGLE_ID="Enter Google OAuth Client ID: "
set /p GOOGLE_SECRET="Enter Google OAuth Client Secret: "
set /p OPENAI_KEY="Enter OpenAI API Key: "
set /p REDIS_URL="Enter Redis URL (or press Enter for localhost): "

if "%REDIS_URL%"=="" set REDIS_URL=redis://localhost:6379

echo.
echo Generating secure JWT secrets...

REM Generate JWT secrets using Node.js
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('base64').slice(0, 64))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('base64').slice(0, 64))"') do set JWT_REFRESH_SECRET=%%i

(
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=production
echo API_BASE_URL=https://%API_DOMAIN%
echo.
echo # Database Configuration
echo DATABASE_URL=postgresql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/%DB_NAME%?schema=public
echo.
echo # JWT Configuration
echo JWT_SECRET=%JWT_SECRET%
echo JWT_REFRESH_SECRET=%JWT_REFRESH_SECRET%
echo JWT_EXPIRES_IN=15m
echo JWT_REFRESH_EXPIRES_IN=7d
echo.
echo # Google OAuth Configuration
echo GOOGLE_CLIENT_ID=%GOOGLE_ID%
echo GOOGLE_CLIENT_SECRET=%GOOGLE_SECRET%
echo GOOGLE_CALLBACK_URL=https://%API_DOMAIN%/auth/google/callback
echo.
echo # OpenAI Configuration
echo OPENAI_API_KEY=%OPENAI_KEY%
echo OPENAI_TIMEOUT_MS=120000
echo OPENAI_CONCEPT_NOTES_TIMEOUT_MS=150000
echo.
echo # Redis Configuration
echo REDIS_URL=%REDIS_URL%
echo.
echo # CORS Configuration
echo FRONTEND_URL=https://%DOMAIN%
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=uploads/
echo.
echo # Logging
echo LOG_LEVEL=info
) > backend\.env.production

echo.
echo Done: Backend .env.production created
echo.

echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Production environment files created:
echo   - .env.production
echo   - backend\.env.production
echo.
echo IMPORTANT SECURITY NOTES:
echo   - These files contain sensitive information
echo   - Never commit them to version control
echo   - Keep them secure
echo   - Use different values for different environments
echo.
echo Next steps:
echo   1. Review the generated files
echo   2. Run: deploy.bat
echo   3. Follow DEPLOYMENT_GUIDE.md for complete instructions
echo.
pause
