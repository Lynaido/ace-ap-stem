# Production Deployment Checklist

This checklist ensures your AAS application is production-ready before deployment.

## ✅ Environment Variables

### Frontend (.env.production)
- [ ] `REACT_APP_API_URL` - Set to your production backend URL
- [ ] `REACT_APP_ENV=production`
- [ ] `REACT_APP_ENABLE_ANALYTICS=true` (if using)
- [ ] `REACT_APP_ENABLE_DEBUG_MODE=false`
- [ ] Add Google Analytics ID if applicable
- [ ] Add Sentry DSN if using error tracking

### Backend (.env.production)
- [ ] `NODE_ENV=production`
- [ ] `PORT` - Set to appropriate port (default: 3001)
- [ ] `API_BASE_URL` - Your production API domain
- [ ] `DATABASE_URL` - Production PostgreSQL connection string with connection pooling
- [ ] `DIRECT_URL` - Direct PostgreSQL connection for migrations
- [ ] `JWT_SECRET` - **CRITICAL**: Generate new strong secret (64+ chars)
- [ ] `JWT_REFRESH_SECRET` - **CRITICAL**: Generate new strong secret (128+ chars)
- [ ] `GOOGLE_CLIENT_ID` - Production Google OAuth credentials
- [ ] `GOOGLE_CLIENT_SECRET` - Production Google OAuth credentials
- [ ] `GOOGLE_CALLBACK_URL` - Update with production domain
- [ ] `OPENAI_API_KEY` - Production OpenAI API key with proper rate limits
- [ ] `REDIS_URL` - Production Redis instance (not localhost!)
- [ ] `FRONTEND_URL` - Your production frontend domain
- [ ] `LOG_LEVEL=info` or `warn` (not debug)

## 🔐 Security Checklist

- [ ] All secrets are unique and not shared between dev/prod
- [ ] JWT secrets are cryptographically strong (use: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`)
- [ ] Database credentials are secure and not default values
- [ ] OpenAI API key has appropriate rate limits configured
- [ ] CORS is configured to only allow your production frontend domain
- [ ] No API keys or secrets are committed to git
- [ ] Redis is password-protected if exposed

## 🗄️ Database Checklist

- [ ] Production database is created and accessible
- [ ] Database connection pooling is enabled (pgbouncer)
- [ ] SSL mode is enabled for database connections
- [ ] Run migrations: `cd backend && npm run db:migrate:prod`
- [ ] Database backups are configured
- [ ] Seed data is loaded if needed: `npm run db:seed`

## 📦 Build & Deploy Checklist

### Frontend
- [ ] Run production build: `npm run build:prod`
- [ ] Verify build output in `/build` directory
- [ ] Test production build locally: `npm run start:prod`
- [ ] Verify all API calls point to production backend
- [ ] Check for console.logs and remove debug code

### Backend
- [ ] Run TypeScript build: `cd backend && npm run build`
- [ ] Verify compiled output in `/backend/dist` directory
- [ ] Run production mode locally to test: `npm run start:prod`
- [ ] Verify all environment variables are loaded correctly
- [ ] Check server logs show `environment: 'production'`

## 🚀 Deployment Steps

### Railway (Backend)
1. Create new Railway project
2. Add PostgreSQL database service
3. Copy all environment variables from `.env.production`
4. Set `NODE_ENV=production`
5. Deploy backend from `/backend` directory
6. Run migrations after deployment
7. Verify `/health` endpoint returns 200

### Hostinger (Frontend)
1. Build production frontend: `npm run build:prod`
2. Upload `/build` folder contents to public_html
3. Ensure `.htaccess` file is present for React Router
4. Verify environment variables in build
5. Test all routes and API connectivity

## 🧪 Post-Deployment Testing

- [ ] Health check endpoint returns 200: `/health`
- [ ] API documentation is accessible: `/api-docs`
- [ ] User registration works
- [ ] User login works
- [ ] Problem upload and solving works
- [ ] AI chatbot responds correctly
- [ ] File uploads work
- [ ] Database queries succeed
- [ ] Redis cache is working
- [ ] All pages load without errors
- [ ] Mobile responsiveness is correct
- [ ] HTTPS certificates are valid

## 📊 Monitoring Setup

- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure application monitoring
- [ ] Set up database performance monitoring
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors

## 🔄 Rollback Plan

Document your rollback procedure:
1. Keep previous build artifacts
2. Database migration rollback strategy
3. Environment variable backup
4. DNS/domain rollback if needed

## 📝 Important Commands

### Generate Strong Secrets
```bash
# JWT Secret (64 bytes = 86 chars base64)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# JWT Refresh Secret (128 bytes = 171 chars base64)
node -e "console.log(require('crypto').randomBytes(128).toString('base64'))"
```

### Build Commands
```bash
# Frontend production build
npm run build:prod

# Backend production build
cd backend && npm run build

# Combined build
npm run deploy:build
```

### Database Commands
```bash
# Run production migrations
cd backend && npm run db:migrate:prod

# Seed database
cd backend && npm run db:seed
```

### Start Production
```bash
# Frontend (serves static build)
npm run start:prod

# Backend (runs compiled JS)
cd backend && npm run start:prod
```

## ⚠️ Critical Warnings

1. **NEVER** commit `.env` or `.env.production` files to git
2. **ALWAYS** use different secrets for dev vs production
3. **NEVER** use default database passwords
4. **ALWAYS** enable SSL for database connections in production
5. **NEVER** set `REACT_APP_ENABLE_DEBUG_MODE=true` in production
6. **ALWAYS** set `NODE_ENV=production` for backend in production
7. **NEVER** expose Redis without authentication in production

## ✨ Final Verification

Before going live:
- [ ] All checklist items above are completed
- [ ] Test the application end-to-end in production
- [ ] Verify no sensitive data in logs
- [ ] Confirm backups are working
- [ ] Document any manual steps needed
- [ ] Notify team of deployment
