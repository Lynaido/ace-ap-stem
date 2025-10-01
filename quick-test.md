# 🧪 Quick Testing Guide

## Option 1: Frontend Testing (Easiest)

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   npm start
   ```

2. **Test the flow**:
   - Go to `http://localhost:3000`
   - Sign in with your account
   - Go to "Solve Problems" → Create a test problem
   - Go to "Study Mode" → Select mode → Select problem → Generate Session
   - Watch for AI generation toast and variants!

## Option 2: API Testing with Postman/Insomnia

1. **Login**:
   ```
   POST http://localhost:3001/auth/login
   Body: {"email": "your-email", "password": "your-password"}
   ```

2. **Create Problem**:
   ```
   POST http://localhost:3001/api/problems
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "title": "Test Problem",
     "description": "A 5kg mass falls 10m. Find velocity.",
     "subject": "ap_physics_1_2", 
     "difficulty": "medium"
   }
   ```

3. **Create Study Session**:
   ```
   POST http://localhost:3001/api/study-sessions
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "problemId": "PROBLEM_ID_FROM_STEP_2",
     "metadata": {"studyMode": "practice"}
   }
   ```

4. **Generate AI Variants**:
   ```
   POST http://localhost:3001/api/study-sessions/SESSION_ID/variants
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "studyMode": "Practice Mode",
     "variantCount": 3
   }
   ```

## What to Look For

✅ **Success Indicators**:
- Toast: "Creating study session and generating AI variants..."
- Toast: "Generated 3 AI-powered practice variants!"
- Variants appear with real AI-generated content
- Each variant has title, description, hints, estimated time

❌ **Fallback Indicators**:
- Toast: "AI generation failed, using fallback variants"
- Mock variants appear instead of AI-generated ones

## Troubleshooting

- **No variants generated**: Check OpenAI API key in backend/.env
- **Authentication errors**: Make sure you're logged in
- **Network errors**: Check backend is running on port 3001
- **AI errors**: Check OpenAI API key and credits

