#!/bin/bash

# AAS App Deployment Script for Hostinger
# This script prepares the application for deployment

echo "========================================="
echo "AAS App - Deployment Build Script"
echo "========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    echo "ERROR: backend/.env.production file not found!"
    echo "Please create backend/.env.production from backend/.env.production.example"
    exit 1
fi

echo "Step 1: Installing dependencies..."
echo "-----------------------------------"
npm install
cd backend && npm install && cd ..

echo ""
echo "Step 2: Building frontend..."
echo "-----------------------------------"
npm run build

echo ""
echo "Step 3: Building backend..."
echo "-----------------------------------"
cd backend && npm run build && cd ..

echo ""
echo "Step 4: Running Prisma migrations..."
echo "-----------------------------------"
cd backend && npx prisma generate && cd ..

echo ""
echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo ""
echo "Files ready for deployment:"
echo "  - Frontend: ./build/"
echo "  - Backend: ./backend/dist/"
echo ""
echo "Next steps:"
echo "  1. Upload 'build' folder contents to your domain's public_html"
echo "  2. Upload 'backend' folder to a secure location (not public_html)"
echo "  3. Set up Node.js application in Hostinger control panel"
echo "  4. Configure environment variables in Hostinger"
echo "  5. Run database migrations on production"
echo "  6. Start the backend application"
echo ""
