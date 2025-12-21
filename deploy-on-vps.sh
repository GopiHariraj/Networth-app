#!/bin/bash

# VPS Deployment Script - Run this ON the VPS server
# Connect to your VPS via Google Cloud Console SSH and run this script

set -e  # Exit on error

echo "🚀 Deploying Net Worth App..."
echo "================================"

# Navigate to project directory
cd ~/networth-app || {
    echo "❌ Error: Project directory ~/networth-app not found"
    echo "Please ensure the project is cloned to ~/networth-app"
    exit 1
}

echo "✅ Found project directory"
echo ""

# Pull latest changes
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo ""

# Stop existing containers
echo "🛑 Step 2: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true
echo ""

# Remove old images to force rebuild
echo "🗑️  Step 3: Removing old images..."
docker image rm networth-app-networth-frontend:latest 2>/dev/null || true
docker image rm networth-app-networth-backend:latest 2>/dev/null || true
echo ""

# Build new images (this may take a few minutes)
echo "🔨 Step 4: Building new Docker images..."
echo "⏳ This may take 3-5 minutes, please wait..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo ""

# Start containers
echo "▶️  Step 5: Starting containers..."
docker-compose -f docker-compose.prod.yml up -d
echo ""

# Wait for services to be ready
echo "⏳ Step 6: Waiting for services to initialize..."
sleep 15
echo ""

# Check container status
echo "📊 Step 7: Checking container status..."
docker-compose -f docker-compose.prod.yml ps
echo ""

# Check if containers are healthy
BACKEND_STATUS=$(docker-compose -f docker-compose.prod.yml ps | grep networth-backend | awk '{print $4}')
FRONTEND_STATUS=$(docker-compose -f docker-compose.prod.yml ps | grep networth-frontend | awk '{print $4}')

echo "Backend Status: $BACKEND_STATUS"
echo "Frontend Status: $FRONTEND_STATUS"
echo ""

# Show recent logs
echo "📋 Recent Backend Logs:"
echo "======================"
docker-compose -f docker-compose.prod.yml logs --tail=30 networth-backend
echo ""

echo "📋 Recent Frontend Logs:"
echo "========================"
docker-compose -f docker-compose.prod.yml logs --tail=30 networth-frontend
echo ""

echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "🌐 Application URLs:"
echo "  - Homepage:    http://34.16.36.153/"
echo "  - Login:       http://34.16.36.153/login"
echo "  - Admin Panel: http://34.16.36.153/admin"
echo "  - Settings:    http://34.16.36.153/settings"
echo ""
echo "🔐 Demo Login Credentials:"
echo "  - Email:    admin@fortstec.com"
echo "  - Password: Forts@123"
echo ""
echo "💡 To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f networth-backend"
echo "  docker-compose -f docker-compose.prod.yml logs -f networth-frontend"
