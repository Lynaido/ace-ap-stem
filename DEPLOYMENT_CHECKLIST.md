# Quick Deployment Checklist

Use this checklist when deploying to Hostinger.

## Pre-Deployment

### 1. Environment Configuration
- [ ] Create `.env.production` from `.env.production.example`
- [ ] Create `backend/.env.production` from `backend/.env.production.example`
- [ ] Update `REACT_APP_API_URL` with your API domain
- [ ] Generate strong JWT secrets (min 32 characters)
  - [ ] `JWT_SECRET`
  - [ ] `JWT_REFRESH_SECRET`
- [ ] Add your Google OAuth credentials
- [ ] Add your OpenAI API key
- [ ] Configure `FRONTEND_URL` and `API_BASE_URL`

### 2. Local Build
- [ ] Run `npm install` in root directory
- [ ] Run `npm install` in backend directory
- [ ] Test locally: `npm run dev`
- [ ] Run build: `deploy.bat` (Windows) or `./deploy.sh` (Linux/Mac)
- [ ] Verify `build/` folder created
- [ ] Verify `backend/dist/` folder created

## Hostinger Setup

### 3. Database
- [ ] Create PostgreSQL database in Hostinger control panel
- [ ] Note database credentials (host, port, name, user, password)
- [ ] Update `DATABASE_URL` in `backend/.env.production`

### 4. Backend Deployment
- [ ] Upload/clone backend code to `~/backend` (NOT public_html)
- [ ] Rename `.env.production` to `.env`
- [ ] SSH into server
- [ ] Run `npm install --production`
- [ ] Run `npm run build` (if not built locally)
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate deploy`
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start app: `pm2 start ecosystem.config.js`
- [ ] Save PM2 config: `pm2 save`
- [ ] Enable PM2 startup: `pm2 startup`
- [ ] Verify running: `pm2 list`

### 5. Frontend Deployment
- [ ] Upload `build/` folder contents to `public_html`
- [ ] Verify `.htaccess` is uploaded
- [ ] Check file permissions (755 for folders, 644 for files)

### 6. Domain & SSL
- [ ] Configure main domain to point to frontend
- [ ] Create subdomain `api.yourdomain.com` for backend
- [ ] Point API subdomain to backend application
- [ ] Enable SSL certificate (free Let's Encrypt)
- [ ] Force HTTPS redirect
- [ ] Test domain resolution

### 7. Redis Setup (Choose One)
- [ ] Option A: Use Hostinger Redis (if available)
- [ ] Option B: Sign up for Redis Cloud (free tier)
- [ ] Option C: Modify code to work without Redis
- [ ] Update `REDIS_URL` in backend `.env`
- [ ] Restart backend: `pm2 restart aas-backend`

## Post-Deployment Testing

### 8. Functionality Tests
- [ ] Visit frontend: `https://yourdomain.com`
- [ ] Check for console errors (F12 → Console)
- [ ] Test API health endpoint: `https://api.yourdomain.com/health`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test Google OAuth login
- [ ] Test AI features (concept notes, problem solving)
- [ ] Test file uploads
- [ ] Test video playback
- [ ] Check mobile responsiveness

### 9. Backend Monitoring
- [ ] Check PM2 status: `pm2 list`
- [ ] View logs: `pm2 logs aas-backend`
- [ ] Check for errors in logs
- [ ] Monitor memory usage: `pm2 monit`

### 10. Security
- [ ] Verify SSL is working (padlock icon in browser)
- [ ] Check CORS is working (API calls from frontend)
- [ ] Ensure `.env` files are not publicly accessible
- [ ] Verify backend is not in public_html
- [ ] Test rate limiting on API endpoints
- [ ] Check that secrets are not in frontend bundle

## Optional Enhancements

### 11. Monitoring & Logging
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up analytics (Google Analytics)
- [ ] Configure log rotation

### 12. Performance
- [ ] Test page load speed
- [ ] Check Lighthouse score
- [ ] Enable gzip compression
- [ ] Configure CDN (if needed)
- [ ] Optimize images

## Maintenance

### Regular Tasks
- [ ] Monitor disk space
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Test backup restoration quarterly

## Rollback Plan

### If Deployment Fails
1. Check PM2 logs: `pm2 logs aas-backend`
2. Verify environment variables
3. Check database connectivity
4. Roll back to previous version if needed
5. Contact Hostinger support for server issues

## Common Issues & Solutions

### Backend won't start
```bash
pm2 logs aas-backend  # Check error logs
node -v               # Verify Node.js version
pm2 delete all        # Remove and restart
pm2 start ecosystem.config.js
```

### Database connection errors
- Double-check DATABASE_URL format
- Verify credentials in Hostinger panel
- Check database server is running

### CORS errors
- Verify FRONTEND_URL in backend .env
- Check REACT_APP_API_URL in frontend

### 404 on page refresh
- Ensure .htaccess is uploaded
- Check mod_rewrite is enabled

## Quick Commands Reference

```bash
# PM2 Management
pm2 list                    # List all apps
pm2 logs aas-backend        # View logs
pm2 restart aas-backend     # Restart app
pm2 stop aas-backend        # Stop app
pm2 delete aas-backend      # Remove app

# Database
npx prisma migrate deploy   # Run migrations
npx prisma studio          # Open database GUI
npx prisma generate        # Generate client

# Logs
tail -f ~/backend/logs/combined.log
tail -f ~/backend/logs/err.log
```

## Support Contacts

- Hostinger Support: https://hostinger.com/support
- Deployment Guide: See DEPLOYMENT_GUIDE.md
- Application Docs: See README.md

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Production URLs**:
- Frontend: ___________
- Backend API: ___________
