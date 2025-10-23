#!/bin/bash
# Backend Health Check & Auto-Restart Script
# Add this to a cron job to run every 5 minutes

set -e

# Set Node.js path for Hostinger
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

BACKEND_DIR=~/backend
HEALTH_URL="http://localhost:3001/health"
LOG_FILE=~/backend-health.log

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== Health Check Started =========="

# Check if backend is responding
if curl -f -s --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
    log "✅ Backend is healthy"
    exit 0
else
    log "❌ Backend is not responding!"

    # Check if PM2 process exists
    cd "$BACKEND_DIR"
    PM2_STATUS=$(npx pm2 jlist 2>/dev/null || echo "[]")

    if echo "$PM2_STATUS" | grep -q "aas-backend"; then
        log "PM2 process exists but not responding - Restarting..."
        npx pm2 restart aas-backend
    else
        log "PM2 process not found - Starting from ecosystem config..."
        npx pm2 start ecosystem.config.js
    fi

    # Wait and verify
    sleep 5
    if curl -f -s --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
        log "✅ Backend successfully restarted"
    else
        log "⚠️ Backend still not responding after restart!"
        log "Please check logs: npx pm2 logs aas-backend"
    fi
fi

log "========== Health Check Completed =========="
