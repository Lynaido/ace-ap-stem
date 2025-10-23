#!/bin/bash
# Minimal PM2 startup script for Hostinger
# Avoids npx overhead by using direct pm2 installation

set -e

export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
cd ~/backend

echo "Starting backend with minimal process overhead..."

# Install pm2 globally in user space (one-time)
if [ ! -f "$HOME/.npm-global/bin/pm2" ]; then
    echo "Installing PM2 globally..."
    npm config set prefix ~/.npm-global
    npm install -g pm2@latest
    export PATH=$HOME/.npm-global/bin:$PATH
fi

# Use direct pm2 binary instead of npx
export PATH=$HOME/.npm-global/bin:$PATH

# Check if already running
if pm2 pid aas-backend > /dev/null 2>&1; then
    echo "Backend already running. Restarting..."
    pm2 restart aas-backend
else
    echo "Starting backend..."
    pm2 start ecosystem.config.js
fi

echo ""
echo "✅ Backend started!"
echo ""
echo "To check status: ~/.npm-global/bin/pm2 status"
echo "To view logs:    ~/.npm-global/bin/pm2 logs aas-backend"
echo "To stop:         ~/.npm-global/bin/pm2 stop aas-backend"
