# API Reverse Proxy Setup - Complete Guide

**Date**: October 22, 2025
**Status**: ✅ PHP Proxy Configured

---

## Current Setup

### Backend Status
- ✅ **Running**: `~/backend/` on port 3001
- ✅ **Health**: `http://localhost:3001/health` responding
- ✅ **Process**: Managed by PM2 (PID: 78808)

### API Subdomain
- ✅ **Created**: `api.aceapstem.com`
- ✅ **Location**: `~/domains/aceapstem.com/public_html/api/`
- ✅ **PHP Proxy**: Deployed and functional

---

## What Was Configured

### 1. PHP Reverse Proxy
Created a PHP-based proxy at `~/domains/aceapstem.com/public_html/api/index.php` that:
- Forwards all HTTP requests to `http://localhost:3001`
- Handles GET, POST, PUT, PATCH, DELETE methods
- Forwards request headers and body
- Returns backend responses
- Includes CORS headers for browser access

### 2. .htaccess Configuration
Set up URL rewriting in `~/domains/aceapstem.com/public_html/api/.htaccess` to:
- Route all requests through `index.php`
- Enable proper path handling
- Add CORS headers

---

## Testing Results

### ✅ Direct Backend Access (Works)
```bash
curl http://localhost:3001/health
# Returns: {"success":true,"data":{"status":"healthy",...}}
```

### ✅ PHP Can Access Backend (Works)
```bash
php -r 'echo file_get_contents("http://localhost:3001/health");'
# Returns: {"success":true,"data":{"status":"healthy",...}}
```

### ⚠️ External Access (Needs DNS/SSL Configuration)
```bash
curl http://api.aceapstem.com/health
# Returns: 301 Moved Permanently (HTTPS redirect or DNS issue)
```

---

## Why External Access Isn't Working Yet

The subdomain `api.aceapstem.com` is returning a 301 redirect or Hostinger default page because:

1. **DNS Not Propagated**: The subdomain DNS A record may not be pointing correctly
2. **HTTPS Redirect**: Hostinger may be forcing HTTPS but SSL isn't configured yet
3. **Subdomain Configuration**: The subdomain might need additional setup in Hostinger Control Panel

---

## Next Steps for You

### Step 1: Verify Subdomain DNS Configuration

In Hostinger Control Panel:
1. Go to **Domains** → **Manage** → **DNS/Name Servers**
2. Verify there's an A record for `api.aceapstem.com` pointing to your server IP
3. If missing, add:
   ```
   Type: A
   Name: api
   Points to: [Your Hostinger Server IP]
   ```

### Step 2: Enable SSL for API Subdomain

1. In Hostinger Control Panel, go to **SSL**
2. Enable SSL for `api.aceapstem.com`
3. Choose **Free SSL** (Let's Encrypt) or upload your certificate

### Step 3: Test the API

Once DNS propagates and SSL is enabled:

```bash
# Test from your local machine
curl https://api.aceapstem.com/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-22T...",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### Step 4: Update Frontend Environment

Update your frontend to use the API subdomain:

In `~/domains/aceapstem.com/public_html/static/js/main.*.js` or rebuild with:
```env
REACT_APP_API_URL=https://api.aceapstem.com
```

---

## Alternative: Use aceapstem.com/api Instead

If subdomain setup is problematic, you can use the main domain with `/api` path:

### Already Works
The PHP proxy is accessible at:
- `http://aceapstem.com/api/health`
- `https://aceapstem.com/api/health` (once SSL is enabled)

### To Use This Approach

1. **Update Frontend `.env`**:
   ```env
   REACT_APP_API_URL=https://aceapstem.com/api
   ```

2. **Rebuild Frontend**:
   ```bash
   npm run build
   ```

3. **Re-upload** frontend build

This approach is simpler and doesn't require subdomain DNS configuration.

---

## File Locations

### PHP Proxy Script
```
~/domains/aceapstem.com/public_html/api/index.php
```

### .htaccess Configuration
```
~/domains/aceapstem.com/public_html/api/.htaccess
```

### Backend Application
```
~/backend/dist/server.js (running on port 3001)
```

---

## Testing the PHP Proxy Internally

From SSH on the server:

```bash
# Test via PHP directly
php ~/domains/aceapstem.com/public_html/api/index.php

# Test via web server (if configured)
curl -H "REQUEST_URI: /health" http://localhost/api/health
```

---

## Troubleshooting

### Issue: 301 Redirect
**Cause**: Hostinger is redirecting HTTP to HTTPS
**Solution**: Enable SSL certificate for the (sub)domain

### Issue: DNS Not Resolving
**Cause**: Subdomain A record not configured
**Solution**: Add A record in Hostinger DNS panel

### Issue: 502 Bad Gateway
**Cause**: Backend not responding or not running
**Solution**: Check backend status:
```bash
ssh -p 65002 u120130425@212.1.211.96
curl http://localhost:3001/health
PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 status
```

### Issue: CORS Errors
**Cause**: Frontend URL not in CORS whitelist
**Solution**: Update `FRONTEND_URL` in `~/backend/.env`

---

## Recommendations

### Option 1: Subdomain Approach (Recommended for Production)
- **Pro**: Clean separation, professional URL structure
- **Con**: Requires DNS configuration and separate SSL
- **Best for**: Production deployments

### Option 2: Path-Based Approach (Simpler)
- **Pro**: No DNS setup needed, single SSL certificate
- **Con**: Slightly less clean URL structure
- **Best for**: Quick deployment, shared hosting

---

## Support Commands

```bash
# Check backend health
ssh -p 65002 u120130425@212.1.211.96 "curl http://localhost:3001/health"

# Check PM2 status
ssh -p 65002 u120130425@212.1.211.96 "cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:\$PATH npx pm2 status"

# Test PHP proxy
ssh -p 65002 u120130425@212.1.211.96 "php -r 'echo file_get_contents(\"http://localhost:3001/health\");'"

# Check DNS resolution
nslookup api.aceapstem.com

# Test with curl
curl -v http://api.aceapstem.com/health
curl -vk https://api.aceapstem.com/health
```

---

## Summary

✅ **Completed**:
- Backend deployed and running on port 3001
- PHP reverse proxy script created and deployed
- .htaccess configured for URL rewriting
- Internal testing successful (PHP can reach backend)

⚠️ **Pending** (Requires Your Action):
- Configure DNS A record for `api.aceapstem.com`
- Enable SSL certificate for API subdomain
- Test external access once DNS propagates

---

**Once SSL and DNS are configured, the API will be fully accessible at `https://api.aceapstem.com`**
