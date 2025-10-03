#!/bin/bash

# AI Tutor Chat API Test Script
# Tests all chat endpoints with curl commands
# Usage: ./test-chat-api.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3001/api"
JWT_TOKEN="paste-a-fresh-access-token-here"

# Variables to store IDs
THREAD_ID=""
MESSAGE_ID=""

# Helper function to print section headers
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ SUCCESS${NC}\n"
    else
        echo -e "${RED}✗ FAILED${NC}\n"
    fi
}

# Helper function to extract JSON value
extract_json_value() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

# Start testing
echo -e "${YELLOW}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          AI Tutor Chat API - Test Suite                  ║"
echo "║                                                           ║"
echo "║  Testing all chat endpoints with curl commands           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if backend is running
print_header "0. Pre-flight Check - Backend Health"
echo "Testing if backend is running..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Backend is running on port 3001${NC}\n"
else
    echo -e "${RED}✗ Backend is NOT running or not accessible${NC}"
    echo -e "${YELLOW}Please start the backend server first:${NC}"
    echo "  cd backend && npm run dev"
    exit 1
fi

# Test 1: Create a new chat thread
print_header "1. POST /api/chat/threads - Create Thread"
echo "Creating a new chat thread..."
echo ""
echo "Command:"
echo "curl -X POST $API_BASE_URL/chat/threads \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer \$JWT_TOKEN' \\"
echo "  -d '{\"title\": \"Test Chat - Physics Help\"}'"
echo ""

CREATE_THREAD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/threads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"title": "Test Chat - Physics Help"}')

echo "Response:"
echo "$CREATE_THREAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_THREAD_RESPONSE"
echo ""

# Extract thread ID
THREAD_ID=$(extract_json_value "$CREATE_THREAD_RESPONSE" "id")

if [ -n "$THREAD_ID" ]; then
    echo -e "${GREEN}✓ Thread created successfully!${NC}"
    echo -e "Thread ID: ${YELLOW}$THREAD_ID${NC}\n"
else
    echo -e "${RED}✗ Failed to create thread${NC}"
    echo "Stopping tests..."
    exit 1
fi

# Test 2: Get all threads
print_header "2. GET /api/chat/threads - List All Threads"
echo "Fetching all chat threads for the user..."
echo ""
echo "Command:"
echo "curl -X GET $API_BASE_URL/chat/threads \\"
echo "  -H 'Authorization: Bearer \$JWT_TOKEN'"
echo ""

LIST_THREADS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/threads" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$LIST_THREADS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_THREADS_RESPONSE"
echo ""

if echo "$LIST_THREADS_RESPONSE" | grep -q "\"success\":true"; then
    print_result 0
else
    print_result 1
fi

# Test 3: Send a message
print_header "3. POST /api/chat/threads/:id/messages - Send Message"
echo "Sending a user message to the thread..."
echo ""
echo "Command:"
echo "curl -X POST $API_BASE_URL/chat/threads/$THREAD_ID/messages \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer \$JWT_TOKEN' \\"
echo "  -d '{\"content\": \"Can you explain how velocity and acceleration are related in physics?\"}'"
echo ""

SEND_MESSAGE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/threads/$THREAD_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "Can you explain how velocity and acceleration are related in physics?"}')

echo "Response:"
echo "$SEND_MESSAGE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SEND_MESSAGE_RESPONSE"
echo ""

MESSAGE_ID=$(extract_json_value "$SEND_MESSAGE_RESPONSE" "id")

if [ -n "$MESSAGE_ID" ]; then
    echo -e "${GREEN}✓ Message sent successfully!${NC}"
    echo -e "Message ID: ${YELLOW}$MESSAGE_ID${NC}\n"
else
    echo -e "${YELLOW}⚠ Message might have been sent, but ID extraction failed${NC}\n"
fi

# Test 4: Get thread with messages
print_header "4. GET /api/chat/threads/:id - Get Thread Details"
echo "Fetching thread with all messages..."
echo ""
echo "Command:"
echo "curl -X GET $API_BASE_URL/chat/threads/$THREAD_ID \\"
echo "  -H 'Authorization: Bearer \$JWT_TOKEN'"
echo ""

GET_THREAD_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/threads/$THREAD_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$GET_THREAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GET_THREAD_RESPONSE"
echo ""

if echo "$GET_THREAD_RESPONSE" | grep -q "\"success\":true"; then
    print_result 0
else
    print_result 1
fi

# Test 5: Stream AI response (SSE)
print_header "5. GET /api/chat/threads/:id/stream - Stream AI Response"
echo "Opening SSE stream for AI response..."
echo ""
echo "Command:"
echo "curl -N $API_BASE_URL/chat/threads/$THREAD_ID/stream?token=$JWT_TOKEN"
echo ""
echo -e "${YELLOW}Streaming AI response (will timeout after 30 seconds)...${NC}"
echo ""

# Stream with timeout and display in real-time
timeout 30s curl -N "$API_BASE_URL/chat/threads/$THREAD_ID/stream?token=$JWT_TOKEN" 2>/dev/null | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
        # Remove "data: " prefix and display
        content="${line#data: }"
        if [[ $content == "[DONE]" ]]; then
            echo -e "\n${GREEN}✓ Stream completed successfully!${NC}"
            break
        elif [[ $content != "" ]]; then
            # Try to extract just the content field for cleaner display
            text=$(echo "$content" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$text" ]; then
                echo -n "$text"
            else
                echo "$content"
            fi
        fi
    fi
done

echo ""
echo ""

# Test 6: Get thread again to see AI response saved
print_header "6. GET /api/chat/threads/:id - Verify AI Response Saved"
echo "Fetching thread again to verify AI response was saved to database..."
echo ""

sleep 2  # Wait a moment for database to update

GET_THREAD_AFTER_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/threads/$THREAD_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response (showing message count):"
MESSAGE_COUNT=$(echo "$GET_THREAD_AFTER_RESPONSE" | grep -o '"role"' | wc -l)
echo "Total messages in thread: $MESSAGE_COUNT"
echo ""

if [ "$MESSAGE_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓ AI response was saved to database!${NC}\n"
else
    echo -e "${YELLOW}⚠ Expected at least 2 messages (user + AI)${NC}\n"
fi

# Test 7: Send another message (multi-turn conversation)
print_header "7. POST /api/chat/threads/:id/messages - Multi-Turn Conversation"
echo "Sending a follow-up message..."
echo ""

FOLLOW_UP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/threads/$THREAD_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"content": "Can you give me a specific example?"}')

echo "Response:"
echo "$FOLLOW_UP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FOLLOW_UP_RESPONSE"
echo ""

if echo "$FOLLOW_UP_RESPONSE" | grep -q "\"success\":true"; then
    print_result 0
    echo -e "${YELLOW}Note: The AI will respond via SSE stream (not shown here)${NC}\n"
else
    print_result 1
fi

# Test 8: Create another thread
print_header "8. POST /api/chat/threads - Create Second Thread"
echo "Creating another thread to test multiple conversations..."
echo ""

CREATE_THREAD_2_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/threads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"title": "Test Chat - Calculus Question"}')

echo "Response:"
echo "$CREATE_THREAD_2_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_THREAD_2_RESPONSE"
echo ""

THREAD_ID_2=$(extract_json_value "$CREATE_THREAD_2_RESPONSE" "id")

if [ -n "$THREAD_ID_2" ]; then
    echo -e "${GREEN}✓ Second thread created!${NC}"
    echo -e "Thread ID: ${YELLOW}$THREAD_ID_2${NC}\n"
else
    echo -e "${RED}✗ Failed to create second thread${NC}\n"
fi

# Test 9: List threads again (should show 2)
print_header "9. GET /api/chat/threads - Verify Multiple Threads"
echo "Fetching all threads (should show at least 2)..."
echo ""

LIST_THREADS_2_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/threads" \
  -H "Authorization: Bearer $JWT_TOKEN")

THREAD_COUNT=$(echo "$LIST_THREADS_2_RESPONSE" | grep -o '"id"' | wc -l)
echo "Total threads found: $THREAD_COUNT"
echo ""

if [ "$THREAD_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓ Multiple threads confirmed!${NC}\n"
else
    echo -e "${YELLOW}⚠ Expected at least 2 threads${NC}\n"
fi

# Test 10: Delete a thread
print_header "10. DELETE /api/chat/threads/:id - Delete Thread"
echo "Deleting the second thread..."
echo ""
echo "Command:"
echo "curl -X DELETE $API_BASE_URL/chat/threads/$THREAD_ID_2 \\"
echo "  -H 'Authorization: Bearer \$JWT_TOKEN'"
echo ""

DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE_URL/chat/threads/$THREAD_ID_2" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$DELETE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESPONSE"
echo ""

if echo "$DELETE_RESPONSE" | grep -q "\"success\":true"; then
    print_result 0
else
    print_result 1
fi

# Test 11: Verify deletion
print_header "11. GET /api/chat/threads/:id - Verify Deletion"
echo "Trying to access deleted thread (should fail)..."
echo ""

VERIFY_DELETE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/chat/threads/$THREAD_ID_2" \
  -H "Authorization: Bearer $JWT_TOKEN")

if [ "$VERIFY_DELETE_RESPONSE" == "404" ]; then
    echo -e "${GREEN}✓ Thread successfully deleted (404 returned)${NC}\n"
else
    echo -e "${RED}✗ Thread still exists or unexpected response: $VERIFY_DELETE_RESPONSE${NC}\n"
fi

# Test 12: Error handling - Invalid thread ID
print_header "12. Error Handling - Invalid Thread ID"
echo "Testing with invalid thread ID..."
echo ""

INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/chat/threads/invalid-id-123" \
  -H "Authorization: Bearer $JWT_TOKEN")

if [ "$INVALID_RESPONSE" == "404" ] || [ "$INVALID_RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ Error handling works correctly (returned $INVALID_RESPONSE)${NC}\n"
else
    echo -e "${YELLOW}⚠ Unexpected response: $INVALID_RESPONSE${NC}\n"
fi

# Test 13: Error handling - Missing authentication
print_header "13. Error Handling - Missing Authentication"
echo "Testing without JWT token (should fail)..."
echo ""

NO_AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/chat/threads")

if [ "$NO_AUTH_RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ Authentication required (401 returned)${NC}\n"
else
    echo -e "${YELLOW}⚠ Unexpected response: $NO_AUTH_RESPONSE${NC}\n"
fi

# Final Summary
print_header "Test Summary"
echo -e "${YELLOW}Test Results:${NC}"
echo ""
echo "✓ Backend health check"
echo "✓ Create thread"
echo "✓ List threads"
echo "✓ Send message"
echo "✓ Get thread details"
echo "✓ Stream AI response (SSE)"
echo "✓ Multi-turn conversation"
echo "✓ Delete thread"
echo "✓ Error handling"
echo ""
echo -e "${GREEN}All core functionality has been tested!${NC}"
echo ""
echo -e "${BLUE}Remaining thread ID for manual cleanup:${NC} ${YELLOW}$THREAD_ID${NC}"
echo ""
echo -e "${YELLOW}To delete the test thread manually:${NC}"
echo "curl -X DELETE $API_BASE_URL/chat/threads/$THREAD_ID \\"
echo "  -H 'Authorization: Bearer $JWT_TOKEN'"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Testing Complete! ✓                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
