#!/bin/bash

# AAS Application Startup Script for Mac
# Double-click this file to start the application

# Get the directory where this script is located
cd "$(dirname "$0")"

echo "====================================="
echo "  Starting AAS Application"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop and try again."
    echo "You can find Docker Desktop in your Applications folder."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env.docker exists and has OpenAI key
if [ ! -f .env.docker ]; then
    echo "⚠️  Warning: .env.docker file not found"
    echo "Creating .env.docker with template..."
    cp .env.docker.example .env.docker 2>/dev/null || true
fi

# Check for OpenAI API key
if grep -q "your-openai-api-key-here" .env.docker 2>/dev/null; then
    echo "⚠️  Warning: OpenAI API key not configured"
    echo "Please edit .env.docker and add your OpenAI API key"
    echo "The app will start but AI features won't work without it."
    echo ""
fi

echo "🚀 Starting all services..."
echo "   - PostgreSQL Database"
echo "   - Redis Cache"
echo "   - Backend API (port 3001)"
echo "   - Frontend App (port 3000)"
echo ""
echo "This may take 2-3 minutes on first run..."
echo ""

# Start Docker Compose
docker-compose --env-file .env.docker up --build -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "====================================="
    echo "  ✅ Application Started Successfully!"
    echo "====================================="
    echo ""
    echo "Frontend:  http://localhost:3000"
    echo "Backend:   http://localhost:3001"
    echo "API Docs:  http://localhost:3001/api-docs"
    echo ""
    echo "Opening browser..."
    sleep 2

    # Open browser
    open http://localhost:3000

    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: Double-click stop-mac.command"
    echo ""
else
    echo ""
    echo "❌ Error: Services failed to start"
    echo "Check logs with: docker-compose logs"
    echo ""
fi

# Keep terminal open
read -p "Press Enter to close this window..."
