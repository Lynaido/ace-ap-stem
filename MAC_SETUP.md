# 🍎 AAS Application - Mac Setup Guide

This guide will help you set up and run the AAS (ACE AP STEM) application on your Mac computer. No technical experience required!

---

## 📋 What You'll Need

- A Mac computer (macOS 10.15 or later)
- At least 5GB of free disk space
- Internet connection (for initial setup only)
- The AAS project folder (this folder)

---

## 🚀 One-Time Setup

### Step 1: Install Docker Desktop

Docker Desktop is a free application that will run all the necessary services for the AAS app.

1. **Download Docker Desktop for Mac**:
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose the version for your Mac:
     - **Apple Silicon (M1/M2/M3)**: Download "Mac with Apple chip"
     - **Intel Mac**: Download "Mac with Intel chip"

2. **Install Docker Desktop**:
   - Open the downloaded `.dmg` file
   - Drag the Docker icon to your Applications folder
   - Open Docker Desktop from Applications
   - Click "Accept" to the terms and conditions
   - Enter your Mac password when prompted
   - Wait for Docker Desktop to start (you'll see a whale icon in your menu bar)

3. **Verify Installation**:
   - When Docker Desktop is running, you should see a whale icon (🐳) in your menu bar at the top
   - It should say "Docker Desktop is running"

**Important**: Keep Docker Desktop running whenever you want to use the AAS app!

---

### Step 2: Configure OpenAI API Key (Optional)

The AAS app uses OpenAI for AI-powered features. If you have an OpenAI API key:

1. Open the file named `.env.docker` in a text editor (TextEdit or any code editor)
2. Find the line: `OPENAI_API_KEY=your-openai-api-key-here`
3. Replace `your-openai-api-key-here` with your actual OpenAI API key
4. Save the file

**Note**: If you don't have an API key, the app will still work but AI features will be disabled.

---

## ▶️ Starting the Application

### Easy Way (Double-Click):

1. **Locate the file** named `start-mac.command` in the AAS project folder
2. **Double-click** the `start-mac.command` file
3. If you see a security warning:
   - Click "OK"
   - Go to **System Preferences → Security & Privacy**
   - Click "Open Anyway"
   - Confirm by clicking "Open"
4. A Terminal window will open and show the startup progress
5. **Wait 2-3 minutes** for the first-time setup
6. Your web browser will automatically open to `http://localhost:3000`

### Manual Way (Terminal):

If double-clicking doesn't work:

1. Open **Terminal** (Applications → Utilities → Terminal)
2. Type: `cd ` (with a space after cd)
3. Drag the AAS project folder into the Terminal window
4. Press Enter
5. Type: `docker-compose --env-file .env.docker up -d`
6. Press Enter
7. Wait 2-3 minutes
8. Open your browser and go to: `http://localhost:3000`

---

## 🛑 Stopping the Application

### Easy Way (Double-Click):

1. **Locate the file** named `stop-mac.command` in the AAS project folder
2. **Double-click** the `stop-mac.command` file
3. A Terminal window will open and confirm the app has stopped

### Manual Way (Terminal):

1. Open **Terminal**
2. Navigate to the project folder (same as step 2-3 in Manual Way above)
3. Type: `docker-compose down`
4. Press Enter

**Note**: Your data is always saved! Stopping the app won't delete any information.

---

## 🌐 Accessing the Application

Once the application is running, open your web browser and visit:

- **Main Application**: http://localhost:3000
- **API Documentation**: http://localhost:3001/api-docs
- **Backend API**: http://localhost:3001

---

## 👤 Login Credentials

### Demo User Account
- **Email**: `demo@aas.com`
- **Password**: `demo123`

This account comes with sample problems, solutions, and notes for testing.

### Admin Account
- **Email**: `admin@aas.com`
- **Password**: `admin123`

**⚠️ Important**: Please change these passwords after your first login!

---

## 🔍 Viewing the Database (Optional)

If you want to view or manage the database:

1. Open Terminal
2. Navigate to the project folder
3. Type: `cd backend && npx prisma studio`
4. Press Enter
5. Your browser will open Prisma Studio at `http://localhost:5555`

---

## ❓ Troubleshooting

### "Docker is not running" Error

**Solution**:
- Open Docker Desktop from Applications
- Wait until you see the whale icon (🐳) in your menu bar
- Try starting the app again

---

### Port Already in Use Error

**Solution**:
- Stop any other applications using ports 3000, 3001, 5432, or 6379
- Or restart your Mac and try again

---

### "Permission Denied" When Double-Clicking

**Solution**:
1. Right-click on `start-mac.command`
2. Select "Get Info"
3. Under "Sharing & Permissions", make sure you have "Read & Write" access
4. Close the window and try again

Alternatively, use the Terminal method described above.

---

### Browser Doesn't Open Automatically

**Solution**:
- Manually open your web browser
- Type in the address bar: `http://localhost:3000`
- Press Enter

---

### Services Fail to Start

**Solution**:
1. Stop the app: `docker-compose down`
2. Remove all containers and volumes: `docker-compose down -v`
3. Rebuild and start: `docker-compose up --build -d`
4. If problem persists, restart Docker Desktop

---

### AI Features Not Working

**Solution**:
- Make sure you've added a valid OpenAI API key in `.env.docker`
- Restart the application after adding the key
- Check that your OpenAI account has available credits

---

## 📊 What's Running?

When you start the application, Docker runs these services:

1. **PostgreSQL Database** - Stores all your data (port 5432)
2. **Redis Cache** - Speeds up the application (port 6379)
3. **Backend API** - Handles all business logic (port 3001)
4. **Frontend App** - The web interface you see (port 3000)

All these run in isolated "containers" managed by Docker.

---

## 💾 Data Persistence

Your data is stored in Docker volumes and persists between restarts:
- **postgres_data**: All database information
- **redis_data**: Cache data
- **uploads**: Uploaded files

To reset all data:
```bash
docker-compose down -v
```
**Warning**: This will delete ALL data!

---

## 🔄 Updating the Application (Future)

If you receive an updated version:

1. Stop the current application
2. Replace the project folder with the new one
3. Start the application again

Docker will automatically rebuild if there are changes.

---

## 📞 Getting Help

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. View application logs:
   ```bash
   docker-compose logs -f
   ```
3. Contact your developer for support

---

## 🎯 Quick Reference

| Action | Command/File |
|--------|--------------|
| Start App | Double-click `start-mac.command` |
| Stop App | Double-click `stop-mac.command` |
| View App | http://localhost:3000 |
| View Logs | `docker-compose logs -f` |
| Reset Data | `docker-compose down -v` |
| Database UI | `cd backend && npx prisma studio` |

---

## ✨ Tips

- **Always ensure Docker Desktop is running** before starting the app
- **Don't delete the project folder** - it contains all configuration
- **Bookmark** `http://localhost:3000` for easy access
- **Keep Docker Desktop open** while using the app
- **Your data persists** even when you stop the app

---

## 🔒 Security Notes

- This is a **local development setup** - only accessible from your Mac
- Default passwords should be **changed immediately** after first login
- The app is **not exposed to the internet**
- Your OpenAI API key is stored locally in `.env.docker`

---

**Enjoy using the AAS Application! 🎓**
