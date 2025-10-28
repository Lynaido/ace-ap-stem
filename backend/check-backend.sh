#!/bin/bash
# Lightweight backend health check without PM2 commands
# Use this instead of pm2 status to avoid process limit issues

export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

echo "====================================="
echo "Backend Health Check"
echo "====================================="
echo ""

# Check if backend process is running
if pgrep -f "dist/server.js" > /dev/null; then
    PID=$(pgrep -f "dist/server.js")
    echo "✅ Backend process running (PID: $PID)"
else
    echo "❌ Backend process NOT running"
    exit 1
fi

echo ""

# Check if port 3001 is listening
if netstat -tuln 2>/dev/null | grep -q ":3001 "; then
    echo "✅ Port 3001 is listening"
else
    echo "⚠️  Port 3001 not found in netstat"
fi

echo ""

# Health endpoint check
echo "Checking health endpoint..."
HEALTH=$(curl -s -w "\n%{http_code}" http://localhost:3001/health)
HTTP_CODE=$(echo "$HEALTH" | tail -1)
BODY=$(echo "$HEALTH" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health endpoint responding: $BODY"
    echo ""
    echo "====================================="
    echo "Backend is HEALTHY ✅"
    echo "====================================="
    exit 0
else
    echo "❌ Health endpoint failed (HTTP $HTTP_CODE)"
    echo ""
    echo "====================================="
    echo "Backend has issues ❌"
    echo "====================================="
    exit 1
fi
