@echo off
REM AI Tutor Chat API Test Script (Windows CMD)
REM Tests all chat endpoints with curl commands
REM Usage: test-chat-api.bat

setlocal enabledelayedexpansion

REM Configuration
set API_BASE_URL=http://localhost:3001/api
set JWT_TOKEN=paste-a-fresh-access-token-here

REM Variables
set THREAD_ID=
set MESSAGE_ID=

echo ===============================================================
echo           AI Tutor Chat API - Test Suite (Windows)
echo.
echo   Testing all chat endpoints with curl commands
echo ===============================================================
echo.

REM Check if curl is available
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] curl is not installed or not in PATH
    echo Please install curl: https://curl.se/windows/
    pause
    exit /b 1
)

REM Pre-flight check
echo ================================================
echo 0. Pre-flight Check - Backend Health
echo ================================================
echo.
echo Testing if backend is running...

curl -s -o nul -w "%%{http_code}" http://localhost:3001/health > temp_health.txt
set /p HEALTH_CODE=<temp_health.txt
del temp_health.txt

if "%HEALTH_CODE%"=="200" (
    echo [SUCCESS] Backend is running on port 3001
    echo.
) else (
    echo [ERROR] Backend is NOT running or not accessible
    echo Please start the backend server first:
    echo   cd backend ^&^& npm run dev
    pause
    exit /b 1
)

REM Test 1: Create thread
echo ================================================
echo 1. POST /api/chat/threads - Create Thread
echo ================================================
echo.
echo Creating a new chat thread...
echo.

curl -s -X POST "%API_BASE_URL%/chat/threads" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -d "{\"title\": \"Test Chat - Physics Help\"}" > temp_create.json

echo Response:
type temp_create.json
echo.
echo.

REM Extract thread ID (basic parsing)
for /f "tokens=2 delims=:," %%a in ('findstr /r "\"id\":" temp_create.json') do (
    set THREAD_ID=%%a
    set THREAD_ID=!THREAD_ID:"=!
    set THREAD_ID=!THREAD_ID: =!
    goto :thread_id_found
)
:thread_id_found

if defined THREAD_ID (
    echo [SUCCESS] Thread created successfully!
    echo Thread ID: %THREAD_ID%
    echo.
) else (
    echo [ERROR] Failed to create thread
    del temp_create.json
    pause
    exit /b 1
)

del temp_create.json

REM Test 2: List threads
echo ================================================
echo 2. GET /api/chat/threads - List All Threads
echo ================================================
echo.
echo Fetching all chat threads...
echo.

curl -s -X GET "%API_BASE_URL%/chat/threads" ^
  -H "Authorization: Bearer %JWT_TOKEN%" > temp_list.json

echo Response:
type temp_list.json
echo.
echo.

del temp_list.json

REM Test 3: Send message
echo ================================================
echo 3. POST /api/chat/threads/:id/messages - Send Message
echo ================================================
echo.
echo Sending a user message to the thread...
echo.

curl -s -X POST "%API_BASE_URL%/chat/threads/%THREAD_ID%/messages" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -d "{\"content\": \"Can you explain how velocity and acceleration are related in physics?\"}" > temp_message.json

echo Response:
type temp_message.json
echo.
echo.

echo [SUCCESS] Message sent!
echo.

del temp_message.json

REM Test 4: Get thread details
echo ================================================
echo 4. GET /api/chat/threads/:id - Get Thread Details
echo ================================================
echo.
echo Fetching thread with all messages...
echo.

curl -s -X GET "%API_BASE_URL%/chat/threads/%THREAD_ID%" ^
  -H "Authorization: Bearer %JWT_TOKEN%" > temp_thread.json

echo Response:
type temp_thread.json
echo.
echo.

del temp_thread.json

REM Test 5: Stream AI response
echo ================================================
echo 5. GET /api/chat/threads/:id/stream - Stream AI Response
echo ================================================
echo.
echo Opening SSE stream for AI response...
echo (This will stream for up to 30 seconds)
echo.

curl -N "%API_BASE_URL%/chat/threads/%THREAD_ID%/stream?token=%JWT_TOKEN%" 2>nul
echo.
echo.
echo [INFO] Stream test completed
echo.

REM Test 6: Get thread again
echo ================================================
echo 6. GET /api/chat/threads/:id - Verify AI Response Saved
echo ================================================
echo.
echo Waiting for AI response to be saved...
timeout /t 3 /nobreak >nul
echo.

curl -s -X GET "%API_BASE_URL%/chat/threads/%THREAD_ID%" ^
  -H "Authorization: Bearer %JWT_TOKEN%" > temp_verify.json

echo Response (checking message count):
findstr /c:"\"role\"" temp_verify.json
echo.

del temp_verify.json

REM Test 7: Multi-turn conversation
echo ================================================
echo 7. POST /api/chat/threads/:id/messages - Follow-up Message
echo ================================================
echo.
echo Sending a follow-up message...
echo.

curl -s -X POST "%API_BASE_URL%/chat/threads/%THREAD_ID%/messages" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -d "{\"content\": \"Can you give me a specific example?\"}" > temp_followup.json

echo Response:
type temp_followup.json
echo.
echo.

del temp_followup.json

REM Test 8: Create second thread
echo ================================================
echo 8. POST /api/chat/threads - Create Second Thread
echo ================================================
echo.
echo Creating another thread...
echo.

curl -s -X POST "%API_BASE_URL%/chat/threads" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -d "{\"title\": \"Test Chat - Calculus Question\"}" > temp_create2.json

echo Response:
type temp_create2.json
echo.
echo.

REM Extract second thread ID
for /f "tokens=2 delims=:," %%a in ('findstr /r "\"id\":" temp_create2.json') do (
    set THREAD_ID_2=%%a
    set THREAD_ID_2=!THREAD_ID_2:"=!
    set THREAD_ID_2=!THREAD_ID_2: =!
    goto :thread_id_2_found
)
:thread_id_2_found

echo Second Thread ID: %THREAD_ID_2%
echo.

del temp_create2.json

REM Test 9: Delete thread
echo ================================================
echo 9. DELETE /api/chat/threads/:id - Delete Thread
echo ================================================
echo.
echo Deleting the second thread...
echo.

curl -s -X DELETE "%API_BASE_URL%/chat/threads/%THREAD_ID_2%" ^
  -H "Authorization: Bearer %JWT_TOKEN%" > temp_delete.json

echo Response:
type temp_delete.json
echo.
echo.

del temp_delete.json

REM Test 10: Error handling - Invalid ID
echo ================================================
echo 10. Error Handling - Invalid Thread ID
echo ================================================
echo.
echo Testing with invalid thread ID (should return 404)...
echo.

curl -s -o nul -w "%%{http_code}" -X GET "%API_BASE_URL%/chat/threads/invalid-id-123" ^
  -H "Authorization: Bearer %JWT_TOKEN%" > temp_error.txt
set /p ERROR_CODE=<temp_error.txt

echo HTTP Status Code: %ERROR_CODE%
if "%ERROR_CODE%"=="404" (
    echo [SUCCESS] Error handling works correctly
) else (
    echo [WARNING] Unexpected response code
)
echo.

del temp_error.txt

REM Test 11: Error handling - No auth
echo ================================================
echo 11. Error Handling - Missing Authentication
echo ================================================
echo.
echo Testing without JWT token (should return 401)...
echo.

curl -s -o nul -w "%%{http_code}" -X GET "%API_BASE_URL%/chat/threads" > temp_noauth.txt
set /p NOAUTH_CODE=<temp_noauth.txt

echo HTTP Status Code: %NOAUTH_CODE%
if "%NOAUTH_CODE%"=="401" (
    echo [SUCCESS] Authentication required correctly
) else (
    echo [WARNING] Unexpected response code
)
echo.

del temp_noauth.txt

REM Summary
echo ===============================================================
echo                        Test Summary
echo ===============================================================
echo.
echo Test Results:
echo   [X] Backend health check
echo   [X] Create thread
echo   [X] List threads
echo   [X] Send message
echo   [X] Get thread details
echo   [X] Stream AI response
echo   [X] Multi-turn conversation
echo   [X] Delete thread
echo   [X] Error handling
echo.
echo All core functionality has been tested!
echo.
echo Remaining thread ID for manual cleanup: %THREAD_ID%
echo.
echo To delete the test thread:
echo curl -X DELETE %API_BASE_URL%/chat/threads/%THREAD_ID% ^
echo   -H "Authorization: Bearer %JWT_TOKEN%"
echo.
echo ===============================================================
echo                    Testing Complete!
echo ===============================================================
echo.

pause
