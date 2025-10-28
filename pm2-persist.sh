#!/bin/bash
# PM2 Persistence Setup Script
# Run this script on the server to ensure PM2 restarts your app automatically

set -e

echo "====================================="
echo "PM2 Persistence Setup"
echo "====================================="
echo

# Set Node.js path for Hostinger
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

cd ~/backend

echo "Step 1: Stopping any existing PM2 processes..."
npx pm2 delete aas-backend 2>/dev/null || echo "No existing process to delete"

echo
echo "Step 2: Starting backend with ecosystem config..."
npx pm2 start ecosystem.config.js

echo
echo "Step 3: Saving PM2 process list..."
npx pm2 save --force

echo
echo "Step 4: Checking PM2 status..."
npx pm2 status

echo
echo "Step 5: Testing backend health..."
sleep 3
curl -s http://localhost:3001/health | head -1

echo
echo "====================================="
echo "✅ Setup Complete!"
echo "====================================="
echo
echo "Your backend is now running with:"
echo "  - Auto-restart on crash (PM2)"
echo "  - Saved process list"
echo "  - Max memory: 1GB (will restart if exceeded)"
echo
echo "Next: Set up PM2 startup (may require sudo - contact Hostinger)"
echo "      npx pm2 startup"
echo
