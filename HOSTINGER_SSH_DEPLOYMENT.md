# Hostinger SSH Deployment - Step-by-Step Guide

## Your SSH Credentials
- **IP**: 212.1.211.96
- **Port**: 65002
- **Username**: u120130425

## IMPORTANT: Before You Start

1. **Create PostgreSQL Database** in Hostinger Control Panel
   - Go to Databases → PostgreSQL
   - Create a new database
   - Note: Database name, username, password, hostname

2. **Set up Redis** (Optional but recommended)
   - Use Redis Cloud free tier: https://redis.com/try-free/
   - Or skip Redis (some features may be limited)

---

## Part 1: Deploy Backend via SSH

### Step 1: Connect to Hostinger

Open your terminal (Command Prompt, PowerShell, or Git Bash) and run:

```bash
ssh -p 65002 u120130425@212.1.211.96
```

Enter your password when prompted.

### Step 2: Clone Your Repository

```bash
cd ~
git clone https://github.com/Anas-HK/aas-app.git aas-app
cd aas-app/backend
```

### Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.production.example .env

# Edit the file
nano .env
```

In the nano editor, update these values:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com  # Replace with your actual API domain

# Database - REPLACE WITH YOUR ACTUAL VALUES FROM HOSTINGER
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?schema=public
DIRECT_URL=postgresql://username:password@hostname:5432/database_name?schema=public

# JWT Secrets - GENERATE STRONG RANDOM STRINGS (32+ characters)
JWT_SECRET=your-strong-jwt-secret-min-32-characters-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-min-32-characters-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Redis - Use Redis Cloud or comment out if not using
REDIS_URL=redis://default:password@hostname:port
# Or comment out if not using Redis:
# REDIS_URL=

# CORS - Replace with your actual frontend domain
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**To save in nano:**
- Press `Ctrl + O` (to save)
- Press `Enter` (to confirm)
- Press `Ctrl + X` (to exit)

### Step 4: Install Node.js Dependencies

```bash
npm install --production
```

### Step 5: Build Backend

```bash
npm run build
```

### Step 6: Set up Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

If migrations fail, you may need to push the schema:
```bash
npx prisma db push
```

### Step 7: Install and Configure PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set up PM2 to start on server reboot
pm2 startup
# Copy and run the command that PM2 outputs
```

### Step 8: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs aas-backend

# Test if server is responding
curl http://localhost:3001/health
```

---

## Part 2: Deploy Frontend via SCP

### Step 1: Upload Frontend Build

From your **local machine** (Windows), open a new terminal/command prompt (don't close your SSH session):

```bash
# Navigate to your project
cd C:\Projects\aas_v2\aas-app

# Upload frontend build to public_html
scp -P 65002 -r build/* u120130425@212.1.211.96:~/public_html/

# Upload .htaccess file
scp -P 65002 .htaccess u120130425@212.1.211.96:~/public_html/
```

**Note**: You may need to install an SCP client on Windows. Alternatives:
- Use Git Bash (comes with Git for Windows)
- Use WinSCP (GUI application)
- Use FileZilla

### Alternative: Manual Upload via Hostinger File Manager

1. Log in to Hostinger Control Panel
2. Open File Manager
3. Navigate to `public_html`
4. Delete existing files (if any)
5. Upload all contents from your local `C:\Projects\aas_v2\aas-app\build` folder
6. Ensure `.htaccess` is uploaded

---

## Part 3: Configure Domain and SSL

### Step 1: Set up Subdomain for API

1. Log in to Hostinger Control Panel
2. Go to **Domains**
3. Create subdomain: `api.yourdomain.com`
4. Point it to your backend application (port 3001)
   - This may require setting up a reverse proxy in Apache

### Step 2: Enable SSL

1. Go to **SSL** section in Hostinger
2. Enable SSL for both:
   - `yourdomain.com`
   - `api.yourdomain.com`

### Step 3: Set up Reverse Proxy for Backend

You may need to configure Apache to proxy requests to your Node.js backend:

1. Create or edit `.htaccess` in `api.yourdomain.com` directory:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

---

## Part 4: Verification and Testing

### Step 1: Test Backend

Back in your SSH session:

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs aas-backend --lines 50

# Test health endpoint
curl http://localhost:3001/health
```

### Step 2: Test Frontend

1. Open browser and visit: `https://yourdomain.com`
2. Open browser console (F12)
3. Check for any errors
4. Verify API calls are working

### Step 3: Test Full Flow

1. Try to register/login
2. Upload a problem
3. Test AI features
4. Check saved items

---

## Common Commands for Maintenance

### PM2 Commands

```bash
pm2 list                  # List all apps
pm2 logs aas-backend      # View logs
pm2 restart aas-backend   # Restart app
pm2 stop aas-backend      # Stop app
pm2 delete aas-backend    # Remove from PM2
pm2 monit                 # Monitor resources
```

### Update Backend (After Making Changes)

```bash
ssh -p 65002 u120130425@212.1.211.96
cd ~/aas-app/backend
git pull
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart aas-backend
```

### Update Frontend (After Making Changes)

From local machine:
```bash
npm run build
scp -P 65002 -r build/* u120130425@212.1.211.96:~/public_html/
```

### View Logs

```bash
# PM2 logs
pm2 logs aas-backend

# Or if you have log files:
tail -f ~/aas-app/backend/logs/combined.log
tail -f ~/aas-app/backend/logs/error.log
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check PM2 logs
pm2 logs aas-backend

# Check environment variables
cat ~/aas-app/backend/.env

# Try starting manually to see errors
cd ~/aas-app/backend
node dist/server.js
```

### Database Connection Errors

```bash
# Test database connection
cd ~/aas-app/backend
npx prisma db pull
```

### Frontend 404 Errors on Refresh

- Ensure `.htaccess` is uploaded to `public_html`
- Verify Apache `mod_rewrite` is enabled

### CORS Errors

- Check `FRONTEND_URL` in backend `.env`
- Verify `REACT_APP_API_URL` in frontend build

---

## Security Checklist

- [ ] Strong JWT secrets generated (32+ characters)
- [ ] SSL/HTTPS enabled for both frontend and backend
- [ ] Database credentials are secure and not exposed
- [ ] `.env` file is not publicly accessible
- [ ] Backend is running on non-public port (3001)
- [ ] CORS is properly configured
- [ ] File upload limits are set
- [ ] Rate limiting is enabled

---

## Next Steps After Deployment

1. Set up monitoring (UptimeRobot, Pingdom)
2. Configure backup strategy for database
3. Set up error tracking (Sentry)
4. Monitor PM2 logs regularly
5. Set up automated deployments (GitHub Actions)

---

## Need Help?

If you encounter issues:

1. **Check logs first**: `pm2 logs aas-backend`
2. **Verify environment variables**: Ensure all required variables are set
3. **Check database**: Make sure database is accessible
4. **Contact Hostinger support**: For hosting-specific issues

Good luck with your deployment!
