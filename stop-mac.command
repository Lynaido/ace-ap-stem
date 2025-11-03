#!/bin/bash

# AAS Application Stop Script for Mac
# Double-click this file to stop the application

# Get the directory where this script is located
cd "$(dirname "$0")"

echo "====================================="
echo "  Stopping AAS Application"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Application is already stopped."
    echo ""
    read -p "Press Enter to exit..."
    exit 0
fi

echo "🛑 Stopping all services..."
echo ""

# Stop Docker Compose
docker-compose down

echo ""
echo "====================================="
echo "  ✅ Application Stopped Successfully"
echo "====================================="
echo ""
echo "All services have been stopped."
echo "Your data is saved and will be available when you restart."
echo ""
echo "To start again: Double-click start-mac.command"
echo ""

# Keep terminal open
read -p "Press Enter to close this window..."
