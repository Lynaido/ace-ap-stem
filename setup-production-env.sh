#!/bin/bash

# Production Environment Setup Script
# This script helps you create production environment files

echo "========================================="
echo "AAS App - Production Environment Setup"
echo "========================================="
echo ""

# Check if files already exist
if [ -f ".env.production" ] || [ -f "backend/.env.production" ]; then
    echo "WARNING: Production environment files already exist!"
    read -p "Do you want to overwrite them? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Frontend environment setup
echo "Setting up Frontend environment..."
echo ""

read -p "Enter your production domain (e.g., yourdomain.com): " DOMAIN
read -p "Enter your API subdomain (e.g., api.yourdomain.com): " API_DOMAIN

cat > .env.production << EOF
# Frontend Production Environment Configuration
REACT_APP_API_URL=https://${API_DOMAIN}
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG_MODE=false
EOF

echo "✓ Frontend .env.production created"
echo ""

# Backend environment setup
echo "Setting up Backend environment..."
echo ""

read -p "Enter database host (from Hostinger): " DB_HOST
read -p "Enter database port (usually 5432): " DB_PORT
read -p "Enter database name: " DB_NAME
read -p "Enter database username: " DB_USER
read -s -p "Enter database password: " DB_PASS
echo ""

read -p "Enter Google OAuth Client ID: " GOOGLE_ID
read -s -p "Enter Google OAuth Client Secret: " GOOGLE_SECRET
echo ""

read -s -p "Enter OpenAI API Key: " OPENAI_KEY
echo ""

read -p "Enter Redis URL (or leave blank for localhost): " REDIS_URL
REDIS_URL=${REDIS_URL:-redis://localhost:6379}

# Generate JWT secrets
echo ""
echo "Generating secure JWT secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64').slice(0, 64))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64').slice(0, 64))")

cat > backend/.env.production << EOF
# Server Configuration
PORT=3001
NODE_ENV=production
API_BASE_URL=https://${API_DOMAIN}

# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_SECRET}
GOOGLE_CALLBACK_URL=https://${API_DOMAIN}/auth/google/callback

# OpenAI Configuration
OPENAI_API_KEY=${OPENAI_KEY}
OPENAI_TIMEOUT_MS=120000
OPENAI_CONCEPT_NOTES_TIMEOUT_MS=150000

# Redis Configuration
REDIS_URL=${REDIS_URL}

# CORS Configuration
FRONTEND_URL=https://${DOMAIN}

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Logging
LOG_LEVEL=info
EOF

echo ""
echo "✓ Backend .env.production created"
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Production environment files created:"
echo "  - .env.production"
echo "  - backend/.env.production"
echo ""
echo "IMPORTANT SECURITY NOTES:"
echo "  - These files contain sensitive information"
echo "  - Never commit them to version control"
echo "  - Keep them secure"
echo "  - Use different values for different environments"
echo ""
echo "Next steps:"
echo "  1. Review the generated files"
echo "  2. Run: deploy.sh (or deploy.bat on Windows)"
echo "  3. Follow DEPLOYMENT_GUIDE.md for complete instructions"
echo ""
