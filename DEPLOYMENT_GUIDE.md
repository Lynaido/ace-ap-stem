# AAS App - Hostinger Deployment Guide

This guide will walk you through deploying your AAS Application to Hostinger.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Preparation](#pre-deployment-preparation)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hostinger Requirements
- Hostinger Business or Cloud hosting plan (required for Node.js support)
- SSH access enabled
- Domain configured and pointing to Hostinger
- PostgreSQL database access
- Node.js 18+ support

### Local Requirements
- Node.js 18+ installed
- Git installed
- All dependencies installed locally
- Application tested locally

---

## Pre-Deployment Preparation

### 1. Create Production Environment Files

#### Frontend (.env.production)
```bash
# Copy the example file
cp .env.production.example .env.production
```

Edit `.env.production` and update:
```env
REACT_APP_API_URL=https://api.yourdomain.com  # Your backend API URL
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
```

#### Backend (backend/.env.production)
```bash
# Copy the example file
cp backend/.env.production.example backend/.env.production
```

Edit `backend/.env.production` and update these critical values:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com

# Database - Get from Hostinger Control Panel
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?schema=public

# JWT Secrets - Generate strong random strings
JWT_SECRET=your-strong-secret-min-32-characters
JWT_REFRESH_SECRET=your-strong-refresh-secret-min-32-characters

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Redis - See Redis setup section
REDIS_URL=redis://hostname:6379

# CORS
FRONTEND_URL=https://yourdomain.com
```

### 2. Build the Application

Run the deployment build script:

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:
```bash
npm install
cd backend && npm install && cd ..
npm run build
cd backend && npm run build && cd ..
```

---

## Database Setup

### 1. Create PostgreSQL Database in Hostinger

1. Log in to Hostinger Control Panel
2. Navigate to **Databases → PostgreSQL Databases**
3. Click **Create Database**
4. Note down:
   - Database name
   - Username
   - Password
   - Hostname
   - Port (usually 5432)

### 2. Update DATABASE_URL

Update `backend/.env.production` with your database credentials:
```env
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?schema=public
```

### 3. Run Database Migrations

Via SSH on Hostinger (after uploading backend):
```bash
cd /path/to/backend
npx prisma migrate deploy
npx prisma generate
```

---

## Backend Deployment

### Option 1: Using Hostinger File Manager

1. **Compress Backend Folder**
   - Zip the `backend` folder including:
     - `dist/` (compiled TypeScript)
     - `prisma/` folder
     - `node_modules/` (or install on server)
     - `package.json`
     - `package-lock.json`
     - `.env.production` (rename to `.env` after upload)
     - `ecosystem.config.js`

2. **Upload to Hostinger**
   - Log in to Hostinger Control Panel
   - Open File Manager
   - Navigate to a secure location (NOT public_html): `/home/username/backend`
   - Upload and extract the zip file

3. **Setup via SSH**

Connect via SSH:
```bash
ssh username@yourdomain.com
```

Navigate to backend folder:
```bash
cd ~/backend
```

Rename environment file:
```bash
mv .env.production .env
```

Install dependencies (if not uploaded):
```bash
npm install --production
```

Install PM2 globally:
```bash
npm install -g pm2
```

Generate Prisma client:
```bash
npx prisma generate
```

Run migrations:
```bash
npx prisma migrate deploy
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Using Git (Recommended)

1. **Push to Git Repository**
```bash
git add .
git commit -m "Production build"
git push origin main
```

2. **Clone on Hostinger via SSH**
```bash
ssh username@yourdomain.com
cd ~
git clone your-repo-url backend
cd backend
```

3. **Setup Backend**
```bash
# Copy and configure environment file
cp .env.production.example .env
nano .env  # Edit with your production values

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Setup Prisma
npx prisma generate
npx prisma migrate deploy

# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Configure Node.js Application in Hostinger

Some Hostinger plans require configuring Node.js apps through the control panel:

1. Go to **Advanced → Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application root**: `/home/username/backend`
   - **Application startup file**: `dist/server.js`
   - **Application port**: 3001

4. Add environment variables in the control panel

---

## Frontend Deployment

### 1. Upload Frontend Build

The frontend is a static React application that runs in the browser.

**Option A: File Manager**
1. Open Hostinger File Manager
2. Navigate to `public_html` (or your domain's root folder)
3. Upload all contents from `build/` folder
4. Ensure `.htaccess` file is uploaded

**Option B: FTP**
1. Connect via FTP client (FileZilla, etc.)
2. Upload contents of `build/` folder to `public_html`
3. Ensure `.htaccess` is uploaded for React Router support

**Option C: SSH/SCP**
```bash
# From your local machine
scp -r build/* username@yourdomain.com:public_html/
```

### 2. Verify .htaccess

Ensure `.htaccess` is in the root of your public_html for proper React routing:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Post-Deployment Configuration

### 1. Setup Redis

**Option A: If Hostinger provides Redis**
- Check if Redis is available in your hosting plan
- Update `REDIS_URL` in backend `.env`

**Option B: External Redis Service (Recommended)**
- Sign up for [Redis Cloud](https://redis.com/try-free/) (free tier available)
- Create a database
- Get connection URL
- Update `REDIS_URL` in backend `.env`
- Restart backend: `pm2 restart aas-backend`

**Option C: Disable Redis (if not critical)**
- Modify backend code to handle missing Redis gracefully
- BullMQ features will be disabled

### 2. SSL Certificate

1. In Hostinger Control Panel
2. Go to **SSL** section
3. Enable **Free SSL** or upload your certificate
4. Force HTTPS redirect

### 3. Setup Subdomain for API

1. Create subdomain `api.yourdomain.com` in Hostinger
2. Point it to your backend application
3. Update DNS settings if needed
4. Update `.env` files with correct API URL

### 4. Configure CORS

Ensure your backend `.env` has correct FRONTEND_URL:
```env
FRONTEND_URL=https://yourdomain.com
```

### 5. Test the Deployment

1. Visit your domain: `https://yourdomain.com`
2. Check browser console for errors
3. Test API connectivity
4. Test authentication flows
5. Test file uploads
6. Monitor backend logs:
```bash
pm2 logs aas-backend
```

---

## Environment Variables Checklist

### Critical Backend Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random string (32+ characters)
- [ ] `JWT_REFRESH_SECRET` - Different strong random string
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `FRONTEND_URL` - Your production frontend URL
- [ ] `API_BASE_URL` - Your backend API URL
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `REDIS_URL` - Redis connection string

### Critical Frontend Variables
- [ ] `REACT_APP_API_URL` - Backend API URL

---

## Useful Commands

### PM2 Management
```bash
pm2 list                  # List all applications
pm2 logs aas-backend      # View logs
pm2 restart aas-backend   # Restart application
pm2 stop aas-backend      # Stop application
pm2 delete aas-backend    # Remove from PM2
pm2 monit                 # Monitor resources
```

### Database Management
```bash
npx prisma studio         # Open Prisma Studio (database GUI)
npx prisma migrate deploy # Run migrations
npx prisma generate       # Generate Prisma Client
```

### Logs
```bash
# Backend logs
pm2 logs aas-backend

# Or check log files
tail -f ~/backend/logs/combined.log
tail -f ~/backend/logs/err.log
```

---

## Troubleshooting

### Backend Not Starting
1. Check PM2 logs: `pm2 logs aas-backend`
2. Verify environment variables
3. Check database connection
4. Ensure correct Node.js version: `node -v`
5. Check port availability: `netstat -tulpn | grep 3001`

### Frontend Shows 404 on Refresh
- Ensure `.htaccess` is uploaded and configured correctly
- Check Apache mod_rewrite is enabled

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check backend CORS configuration
- Ensure API URL in frontend `.env.production` is correct

### Database Connection Errors
- Verify DATABASE_URL format
- Check database credentials in Hostinger panel
- Ensure database server is running
- Check if IP whitelist is needed

### Redis Connection Errors
- Verify REDIS_URL
- Check if Redis service is running
- Consider using external Redis service
- Check backend code handles Redis failures

### 500 Internal Server Error
- Check PM2 logs: `pm2 logs aas-backend`
- Check backend error logs
- Verify all environment variables are set
- Check database migrations are up to date

---

## Security Checklist

- [ ] Strong JWT secrets generated (32+ characters)
- [ ] SSL/HTTPS enabled
- [ ] Environment files not in version control (.gitignore)
- [ ] Database credentials secure
- [ ] Backend not in public_html directory
- [ ] CORS properly configured
- [ ] File upload directory has proper permissions
- [ ] Rate limiting configured
- [ ] API keys not exposed in frontend code

---

## Maintenance

### Updating the Application

1. **Make changes locally and test**
2. **Build new version:**
   ```bash
   npm run deploy:build
   ```

3. **Update Backend:**
   ```bash
   ssh username@yourdomain.com
   cd ~/backend
   git pull  # If using git
   npm install
   npm run build
   npx prisma migrate deploy
   pm2 restart aas-backend
   ```

4. **Update Frontend:**
   - Upload new `build/` contents to public_html

### Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor PM2 logs regularly
- Check database performance
- Monitor disk space usage

---

## Support

If you encounter issues:
1. Check logs first: `pm2 logs aas-backend`
2. Verify all environment variables
3. Contact Hostinger support for hosting-specific issues
4. Check application documentation

---

## Quick Deployment Checklist

- [ ] Created `.env.production` files
- [ ] Generated strong JWT secrets
- [ ] Built frontend and backend
- [ ] Created PostgreSQL database on Hostinger
- [ ] Uploaded backend code to secure location
- [ ] Installed dependencies on server
- [ ] Ran database migrations
- [ ] Started backend with PM2
- [ ] Uploaded frontend build to public_html
- [ ] Configured SSL certificate
- [ ] Set up subdomain for API
- [ ] Tested all functionality
- [ ] Configured monitoring

Good luck with your deployment!
