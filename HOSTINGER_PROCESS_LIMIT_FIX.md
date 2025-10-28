# Hostinger Process Limit Fix

## Problem
Hostinger has an 80-process limit. Running `npx pm2` commands spawns too many processes and causes:
```
pthread_create: Resource temporarily unavailable
Aborted (core dumped)
```

## Your Backend IS Running!
Even though PM2 commands fail, your backend is actually running successfully:
```bash
curl http://localhost:3001/health
# Returns: {"success":true,"data":{"status":"healthy",...}}
```

## Solution: Lightweight Management Scripts

### 1. Upload New Scripts to Server

Upload these files to `~/backend/`:
- `start-backend.sh` - Starts backend with minimal overhead
- `check-backend.sh` - Health check without PM2 commands

```bash
# On your local machine
scp backend/start-backend.sh u120130425@us-imm-web572.dqservers.net:~/backend/
scp backend/check-backend.sh u120130425@us-imm-web572.dqservers.net:~/backend/

# SSH to server
ssh u120130425@us-imm-web572.dqservers.net

# Make scripts executable
cd ~/backend
chmod +x start-backend.sh check-backend.sh
```

### 2. Current Status Check (Low Process Usage)

Instead of `npx pm2 status`, use:
```bash
cd ~/backend
./check-backend.sh
```

This checks:
- ✅ Backend process running
- ✅ Port 3001 listening
- ✅ Health endpoint responding

### 3. View Logs Without PM2

```bash
# View latest backend logs
tail -f ~/backend/logs/combined.log

# View errors only
tail -f ~/backend/logs/err.log

# View last 50 lines
tail -50 ~/backend/logs/out.log
```

### 4. Restart Backend If Needed

```bash
# Kill existing backend
pkill -f "dist/server.js"

# Start fresh
cd ~/backend
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
node dist/server.js > logs/out.log 2> logs/err.log &

# Verify it started
./check-backend.sh
```

### 5. Automated Monitoring (Cron)

**DO NOT** use the old health-check.sh that restarts PM2.

Instead, create a lightweight monitoring cron:
```bash
crontab -e
```

Add:
```bash
# Check backend health every 10 minutes (no auto-restart)
*/10 * * * * cd ~/backend && ./check-backend.sh >> ~/backend-monitor.log 2>&1
```

This only monitors - it won't try to restart and cause process explosions.

## Why This Works

**Before (npx pm2):**
- `npx pm2 status` = 15-20 processes spawned ❌
- Multiple overlapping = 80+ processes ❌
- System freezes ❌

**After (lightweight scripts):**
- `./check-backend.sh` = 2-3 processes ✅
- Direct process checks = minimal overhead ✅
- Never hits 80 limit ✅

## Emergency Commands

If backend is stuck:
```bash
# Nuclear option - kill all Node.js
pkill -9 node

# Check what's running
ps aux | grep node | grep -v grep

# Start fresh
cd ~/backend
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
node dist/server.js > logs/out.log 2> logs/err.log &
```

## Testing Backend from Outside

```bash
# From local machine
curl -I https://aaswebapp.com/api/health

# Should return 200 OK with JSON body
```

## Current Deployment Status

✅ Backend running on port 3001
✅ Health endpoint responding
✅ Optimized ecosystem.config.js (fork mode, 1 instance)
❌ Can't use PM2 commands (process limit)
✅ Solution: Use lightweight scripts instead

## Next Steps

1. Upload the new scripts to server
2. Test with `./check-backend.sh`
3. Remove old health-check.sh from cron
4. Verify frontend can reach backend through proxy
5. Monitor logs for any issues

---

**The key insight:** Your backend IS working. You just can't use PM2's management commands due to Hostinger's limits. Use direct process management instead.
