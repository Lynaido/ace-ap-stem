# 📦 Packaging Instructions for Windows Users

This guide explains how to package the AAS application on Windows for delivery to a Mac client.

## 🎯 What You're Creating

A zip file containing:
- All application source code
- Docker configuration files
- Double-click startup/shutdown scripts for Mac
- Comprehensive setup documentation

## ✅ Pre-Packaging Checklist

Before packaging, ensure:

### 1. Clean Build Artifacts
```bash
# Delete build folders (they'll be rebuilt on Mac)
rmdir /s /q build
rmdir /s /q backend\dist
rmdir /s /q node_modules
rmdir /s /q backend\node_modules
```

### 2. Verify Environment Files

**Keep these files** (they're safe templates):
- ✅ `.env.example`
- ✅ `.env.production.example`
- ✅ `.env.docker`
- ✅ `backend/.env.example`
- ✅ `backend/.env.production.example`

**DO NOT include** (contain secrets):
- ❌ `.env`
- ❌ `.env.production`
- ❌ `backend/.env`
- ❌ `backend/.env.production`

**Edit `.env.docker`**:
- Replace `OPENAI_API_KEY=your-openai-api-key-here` with the actual key
- Or instruct client to add it manually (more secure)

### 3. Verify Docker Files Exist

Confirm these files are present:
- ✅ `docker-compose.yml`
- ✅ `Dockerfile.backend`
- ✅ `.dockerignore`
- ✅ `start-mac.command`
- ✅ `stop-mac.command`
- ✅ `MAC_SETUP.md`
- ✅ `DOCKER_README.md`

### 4. Make Scripts Executable (Important for Mac!)

**On Windows with Git Bash**:
```bash
git update-index --chmod=+x start-mac.command
git update-index --chmod=+x stop-mac.command
```

**Alternative - Client will need to do this on Mac**:
```bash
chmod +x start-mac.command
chmod +x stop-mac.command
```

## 📋 Packaging Steps

### Option 1: Using Git

**Best for version control**:

```bash
# 1. Commit all Docker files
git add docker-compose.yml Dockerfile.backend .dockerignore .env.docker
git add start-mac.command stop-mac.command
git add MAC_SETUP.md DOCKER_README.md
git add backend/prisma/seed.ts
git commit -m "Add Docker development environment for Mac"

# 2. Create a clean export
git archive --format=zip --output=AAS-Mac-Setup.zip HEAD

# 3. Send AAS-Mac-Setup.zip to client
```

### Option 2: Manual Zip

**Direct file packaging**:

1. **Create a clean folder**:
   ```
   AAS-Mac-Setup/
   ```

2. **Copy these folders/files**:
   - `src/` (frontend source)
   - `public/` (public assets)
   - `backend/` (backend source)
   - `package.json`
   - `package-lock.json`
   - `docker-compose.yml`
   - `Dockerfile.backend`
   - `.dockerignore`
   - `.env.docker`
   - `.env.example`
   - `.env.production.example`
   - `start-mac.command`
   - `stop-mac.command`
   - `MAC_SETUP.md`
   - `DOCKER_README.md`
   - `PRODUCTION_CHECKLIST.md` (optional)
   - `README.md` (if exists)

3. **DO NOT copy**:
   - `node_modules/`
   - `backend/node_modules/`
   - `build/`
   - `backend/dist/`
   - `.git/`
   - `.env` (actual environment file with secrets)
   - `backend/.env`
   - `uploads/` (contains user data)
   - `backend/uploads/`

4. **Zip the folder**:
   - Right-click → Send to → Compressed (zipped) folder
   - Or use 7-Zip, WinRAR, etc.

## 📧 Delivery to Client

### What to Send

**Package**: `AAS-Mac-Setup.zip`

**Instructions Email**:
```
Subject: AAS Application - Mac Setup Package

Hi [Client Name],

Attached is the AAS application ready for your Mac. Here's what to do:

1. Extract the ZIP file to your Desktop or Documents folder

2. Install Docker Desktop for Mac:
   Download: https://www.docker.com/products/docker-desktop/

   Choose:
   - "Mac with Apple chip" if you have M1/M2/M3 Mac
   - "Mac with Intel chip" for older Macs

3. Open the extracted folder and double-click "start-mac.command"

4. Wait 2-3 minutes for first-time setup

5. The app will automatically open in your browser

For detailed instructions, see MAC_SETUP.md inside the folder.

Login Credentials:
- Demo User: demo@aas.com / demo123
- Admin User: admin@aas.com / admin123

Need help? Reply to this email or call me.

Best regards,
[Your Name]
```

### Optional - Create Welcome Document

Create `START_HERE.txt` in the package:

```
╔════════════════════════════════════════════╗
║  WELCOME TO AAS APPLICATION FOR MAC        ║
╔════════════════════════════════════════════╝

📚 QUICK START GUIDE:

1️⃣  Install Docker Desktop
    → Download: https://docker.com/products/docker-desktop
    → Choose "Mac with Apple chip" or "Mac with Intel chip"
    → Drag to Applications folder
    → Open Docker Desktop

2️⃣  Start the Application
    → Double-click "start-mac.command"
    → Wait 2-3 minutes
    → Browser opens automatically

3️⃣  Login
    → Email: demo@aas.com
    → Password: demo123

4️⃣  Stop the Application
    → Double-click "stop-mac.command"

📖 FULL INSTRUCTIONS:
    → Open "MAC_SETUP.md" for detailed guide

💡 DEVELOPER DOCS:
    → Open "DOCKER_README.md"

❓ HAVING TROUBLE?
    → Check "MAC_SETUP.md" → Troubleshooting section
    → Contact: [your email/phone]

═══════════════════════════════════════════

⚙️  What's Running:
    - Database (PostgreSQL)
    - Cache (Redis)
    - Backend API
    - Frontend Web App

🔒  Your data is safe and stored locally on your Mac.

═══════════════════════════════════════════
```

## ⚠️ Important Notes

### Security Considerations

1. **OpenAI API Key**:
   - Option A: Include it in `.env.docker` (client can't lose it)
   - Option B: Send separately and instruct client to add it (more secure)

2. **Default Passwords**:
   - Inform client to change default passwords immediately
   - They're only for initial setup

### File Sizes

Expected package size:
- **Without node_modules**: ~50-100 MB
- **With node_modules**: ~500 MB - 1 GB (DON'T include!)

### Version Control

If sending updates later:
```bash
# Create versioned package
git archive --format=zip --prefix=AAS-v1.1/ --output=AAS-Mac-Setup-v1.1.zip HEAD
```

## 🧪 Testing Before Delivery

**Optional but recommended**: Test the package on a Mac (VM or physical)

1. Extract the zip
2. Follow MAC_SETUP.md exactly
3. Verify all features work
4. Document any issues

## 📝 Checklist Before Sending

- [ ] Built production frontend successfully
- [ ] Built backend successfully
- [ ] Removed node_modules folders
- [ ] Removed build artifacts
- [ ] Removed .env files with secrets
- [ ] Included .env.docker with API key OR instructions to add it
- [ ] Made .command scripts executable
- [ ] Included MAC_SETUP.md
- [ ] Included DOCKER_README.md
- [ ] Created ZIP file
- [ ] Tested extraction (zip not corrupted)
- [ ] Total size is reasonable (< 150 MB)
- [ ] Wrote clear email instructions

## 🚀 Post-Delivery Support

Be ready to help with:
1. Docker Desktop installation
2. First-time startup issues
3. OpenAI API key configuration (if not included)
4. Troubleshooting Docker errors
5. Password changes

---

**Good luck with the delivery! 🎉**
