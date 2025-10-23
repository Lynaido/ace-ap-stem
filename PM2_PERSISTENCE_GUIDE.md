# PM2 Persistence & Monitoring Guide

## What Happened?

Your backend was stopped because:
- **Server didn't reboot** - It's been up for 51 days
- **PM2 daemon restarted** - On Oct 23 at 18:33:41 (unknown reason)
- **No saved process list** - Your app wasn't configured to auto-restart

## Why PM2 Might Restart

1. **Memory pressure** - System kills processes using too much memory
2. **Hostinger resource limits** - Shared hosting has resource quotas
3. **Manual intervention** - Accidental stop or restart
4. **PM2 updates** - Package updates can restart the daemon

## Solutions to Keep Your Backend Running

### Solution 1: PM2 Process Persistence (Immediate)

Upload and run the `pm2-persist.sh` script on your server:

```bash
# Upload the script
scp -P 65002 pm2-persist.sh u120130425@212.1.211.96:~/

# SSH into server
ssh -p 65002 u120130425@212.1.211.96

# Run the script
chmod +x ~/pm2-persist.sh
~/pm2-persist.sh
```

This script will:
- ✅ Start your backend with the ecosystem config
- ✅ Enable auto-restart on crash (already configured)
- ✅ Save the PM2 process list
- ✅ Verify the backend is healthy

### Solution 2: Automated Health Checks (Recommended)

Set up a cron job to check and restart your backend every 5 minutes:

```bash
# Upload the health check script
scp -P 65002 health-check.sh u120130425@212.1.211.96:~/

# SSH into server
ssh -p 65002 u120130425@212.1.211.96

# Make executable
chmod +x ~/health-check.sh

# Test it manually first
~/health-check.sh

# Add to crontab (run every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * ~/health-check.sh >> ~/health-check-cron.log 2>&1
```

The health check will:
- ✅ Check if backend is responding
- ✅ Auto-restart if it's down
- ✅ Log all actions
- ✅ Work even if PM2 daemon restarts

### Solution 3: PM2 Startup (Requires Server Reboot Persistence)

**Note:** This may not work on shared hosting without sudo access.

```bash
ssh -p 65002 u120130425@212.1.211.96

cd ~/backend
PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 startup

# If it gives you a command to run, copy and execute it
# Then save the process list
PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 save
```

---

## Monitoring Your Backend

### Check Backend Status

```bash
ssh -p 65002 u120130425@212.1.211.96 "cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:\$PATH npx pm2 status"
```

### View Health Check Logs

```bash
ssh -p 65002 u120130425@212.1.211.96 "tail -50 ~/backend-health.log"
```

### Test Backend Manually

```bash
ssh -p 65002 u120130425@212.1.211.96 "curl http://localhost:3001/health"
```

---

## Understanding Your ecosystem.config.js

Your PM2 config already has good settings:

```javascript
{
  autorestart: true,        // ✅ Restarts on crash
  max_memory_restart: '1G', // ✅ Restarts if memory > 1GB
  exec_mode: 'cluster',     // ✅ Runs in cluster mode
  instances: 1              // ✅ Single instance
}
```

---

## Recommendations

### Priority 1: Set up Health Check Cron Job ⭐
This is the **most reliable solution** for shared hosting because:
- Works regardless of PM2 daemon restarts
- No sudo access required
- Catches all failure scenarios
- Simple and effective

### Priority 2: Run PM2 Persist Script
Saves the process list so PM2 remembers your app.

### Priority 3: Monitor Your Application
- Set up external monitoring (UptimeRobot, Pingdom)
- Check `~/backend-health.log` regularly
- Monitor PM2 logs: `npx pm2 logs aas-backend`

---

## Hostinger Limitations

**Shared Hosting Challenges:**
- Limited control over system services
- No sudo access for PM2 startup scripts
- Resource limits may kill processes
- No guarantee of 100% uptime

**Consider Upgrading If:**
- Your site becomes business-critical
- You need guaranteed uptime
- You're experiencing frequent crashes
- You need more control

**Better Options:**
- VPS hosting (full control, root access)
- Managed Node.js hosting (Vercel, Railway, Render)
- Container hosting (Docker, Kubernetes)

---

## Quick Commands Reference

```bash
# SSH into server
ssh -p 65002 u120130425@212.1.211.96

# Check PM2 status
cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 status

# Restart backend
cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 restart aas-backend

# Save PM2 list
cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 save

# View logs
cd ~/backend && PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH npx pm2 logs aas-backend --lines 100

# Test health
curl http://localhost:3001/health
```

---

## Summary

✅ **Current Status**: Backend is running
⚠️ **Risk**: May stop again when PM2 restarts
🛡️ **Solution**: Set up automated health checks (cron job)
📊 **Monitoring**: Check logs regularly

Your backend should stay running indefinitely with the health check cron job in place!
