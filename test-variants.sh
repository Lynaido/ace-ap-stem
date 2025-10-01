#!/bin/bash

# Test script for AI variant generation
# Make sure your backend is running on localhost:3001

echo "🧪 Testing AI Variant Generation API"
echo "====================================="

# Step 1: Login and get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token (you'll need to replace this with actual token from response)
TOKEN="your-jwt-token-here"

# Step 2: Create a problem
echo "2. Creating a test problem..."
PROBLEM_RESPONSE=$(curl -s -X POST http://localhost:3001/api/problems \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Physics Problem",
    "description": "A 5kg block slides down a 30° incline. Find the acceleration.",
    "subject": "ap_physics_1_2",
    "difficulty": "medium"
  }')

echo "Problem created: $PROBLEM_RESPONSE"

# Step 3: Create study session
echo "3. Creating study session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/study-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "problemId": "problem-id-from-step-2",
    "metadata": {
      "studyMode": "practice",
      "notes": "Test session"
    }
  }')

echo "Study session created: $SESSION_RESPONSE"

# Step 4: Generate AI variants
echo "4. Generating AI variants..."
VARIANT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/study-sessions/SESSION_ID/variants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "studyMode": "Practice Mode",
    "variantCount": 3
  }')

echo "AI Variants generated: $VARIANT_RESPONSE"

echo "✅ Test completed!"

