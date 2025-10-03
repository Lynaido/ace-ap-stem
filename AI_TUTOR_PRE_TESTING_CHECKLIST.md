# 🎯 AI Tutor Chat - Pre-Testing Checklist

Before starting your testing session, verify all prerequisites are met:

---

## ✅ Environment Setup

### 1. Database
- [ ] **PostgreSQL is running**
  - Check: Open pgAdmin or run `psql -U postgres`
  - Default port: 5432
  - Database name: `aas_db`

- [ ] **Database is migrated**
  ```bash
  cd backend
  npm run db:migrate
  ```
  - Should see: "Migration applied successfully"

- [ ] **Database connection works**
  - Check `backend/.env` has correct `DATABASE_URL`
  - Format: `postgresql://user:password@localhost:5432/aas_db`

### 2. Backend Dependencies
- [ ] **Node modules installed**
  ```bash
  cd backend
  npm install
  ```
  - Should see: "added XXX packages"

- [ ] **OpenAI package present**
  - Check: `node_modules/openai` folder exists
  - Version: 4.24.1 or higher

- [ ] **OpenAI API key configured**
  - Check `backend/.env` file
  - Should have: `OPENAI_API_KEY=sk-proj-...`
  - Key must be valid (not expired)

### 3. Frontend Dependencies
- [ ] **Node modules installed**
  ```bash
  # From project root
  npm install
  ```
  - Should see: "added XXX packages"

- [ ] **React app configured**
  - Check `package.json` exists
  - Should have `react-scripts` dependency

---

## ✅ Code Verification

### Backend Files Created
- [ ] `backend/src/routes/chatRoutes.ts` exists
- [ ] `backend/src/controllers/chatController.ts` exists
- [ ] `backend/src/services/chatService.ts` exists
- [ ] `backend/src/server.ts` includes chat routes

### Frontend Files Modified
- [ ] `src/utils/api.js` has `chatAPI` object
- [ ] `src/components/chat/ChatPanel.js` uses real API
- [ ] `src/components/chat/ChatPanel.css` has cursor animation

### No Compilation Errors
- [ ] Run TypeScript check:
  ```bash
  cd backend
  npm run build
  ```
  - Should complete without errors

---

## ✅ Configuration Check

### Backend `.env` File
Check `backend/.env` has all required variables:

```properties
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:abc.123@localhost:5432/aas_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# OpenAI (CRITICAL!)
OPENAI_API_KEY=sk-proj-...
OPENAI_TIMEOUT_MS=120000

# Redis (optional for Phase 6.4)
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:3000
```

### Ports Available
- [ ] **Port 3000** is free (frontend)
  - Test: `netstat -ano | findstr :3000`
  - Should be empty

- [ ] **Port 3001** is free (backend)
  - Test: `netstat -ano | findstr :3001`
  - Should be empty

- [ ] **Port 5432** is running (PostgreSQL)
  - Test: `netstat -ano | findstr :5432`
  - Should show postgres process

---

## ✅ Pre-Flight Test

### 1. Start Backend
```bash
cd backend
npm run dev
```

**Expected Output:**
```
[INFO] Server starting...
[INFO] Database connected
[INFO] Server running on http://localhost:3001
```

**✅ Success Indicators:**
- No error messages
- "Server running" appears
- Port 3001 is listening

**❌ Common Errors:**
- "Port 3001 already in use" → Kill existing process
- "Database connection failed" → Check PostgreSQL is running
- "OpenAI API key not set" → Add to `.env` file

### 2. Start Frontend
```bash
# New terminal, from project root
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view aas-app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**✅ Success Indicators:**
- Browser opens automatically
- No compilation errors
- Landing page loads

**❌ Common Errors:**
- "Port 3000 already in use" → Kill existing process
- "Module not found" → Run `npm install`
- "Cannot resolve" → Check import paths

---

## ✅ Quick Smoke Test

Before full testing, verify basic functionality:

### 1. Can Access Backend
Open browser or use curl:
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"ok"}`

### 2. Can Access Frontend
Navigate to: http://localhost:3000
- [ ] Landing page loads
- [ ] No console errors
- [ ] Navigation menu visible

### 3. Can Login
- [ ] Click "Sign In"
- [ ] Enter credentials or sign up
- [ ] Successfully authenticated
- [ ] User menu appears

### 4. Can Access Tutor Page
- [ ] Click "Tutor" in navigation
- [ ] Chat interface loads
- [ ] Welcome message appears
- [ ] Input field is enabled

---

## ✅ Ready to Test Checklist

All of these should be checked before proceeding:

**Environment:**
- [ ] PostgreSQL running
- [ ] Database migrated
- [ ] Node modules installed (backend & frontend)
- [ ] OpenAI API key configured

**Servers:**
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] No compilation errors
- [ ] No runtime errors in console

**Access:**
- [ ] Can login to application
- [ ] Can navigate to Tutor page
- [ ] Chat interface is visible
- [ ] Input field is enabled

**OpenAI:**
- [ ] API key is valid (not expired)
- [ ] Key has available quota
- [ ] No rate limit restrictions

---

## 🚀 You're Ready!

If all items above are checked, proceed to testing:

1. **Follow:** `AI_TUTOR_QUICK_START.md`
2. **Test:** Send messages and verify streaming
3. **Verify:** Persistence and conversation flow
4. **Report:** Any issues or unexpected behavior

---

## 🐛 If Something's Not Checked

### Missing OpenAI API Key?
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Add to `backend/.env`: `OPENAI_API_KEY=sk-proj-...`
4. Restart backend server

### Database Not Running?
1. Start PostgreSQL service
2. Verify connection: `psql -U postgres`
3. Check port 5432 is listening
4. Update `DATABASE_URL` in `backend/.env`

### Ports Already in Use?
1. Find process: `netstat -ano | findstr :<port>`
2. Kill process: `taskkill /PID <process_id> /F`
3. Or use different ports in configuration

### Compilation Errors?
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Clear npm cache: `npm cache clean --force`

---

## 📊 System Requirements

### Minimum
- **Node.js:** 18.x or higher
- **PostgreSQL:** 14.x or higher
- **RAM:** 4GB available
- **Disk:** 500MB free space

### Recommended
- **Node.js:** 20.x (LTS)
- **PostgreSQL:** 15.x
- **RAM:** 8GB available
- **Disk:** 2GB free space
- **Internet:** Stable connection for OpenAI API

---

## ✅ Final Check

Before you click "Test Now":

- [ ] Both servers running without errors
- [ ] Can access both URLs (3000 and 3001)
- [ ] Logged into the application
- [ ] Tutor page is accessible
- [ ] OpenAI API key is valid
- [ ] Database has no connection errors

**All checked? Great! You're ready to test the AI Tutor! 🎉**

Proceed to `AI_TUTOR_QUICK_START.md` for testing instructions.
