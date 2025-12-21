#!/bin/bash

# Deployment script for VPS
# This script deploys the latest changes to the VPS

set -e  # Exit on error

VPS_IP="34.16.36.153"
VPS_USER="adminJ"
PROJECT_DIR="~/networth-app"

echo "🚀 Starting deployment to VPS..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main

echo -e "${BLUE}🔄 Step 2: Connecting to VPS and deploying...${NC}"

# SSH into VPS and run deployment commands
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

cd ~/networth-app || { echo "❌ Project directory not found"; exit 1; }

echo "✅ In project directory"

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker image rm networth-app-networth-frontend:latest || true
docker image rm networth-app-networth-backend:latest || true

# Build new images
echo "🔨 Building new Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo "▶️  Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

# Check logs
echo "📋 Recent backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 networth-backend

echo "📋 Recent frontend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 networth-frontend

echo "✅ Deployment complete!"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Application available at: http://${VPS_IP}${NC}"
    echo -e "${GREEN}🔐 Login page: http://${VPS_IP}/login${NC}"
    echo -e "${GREEN}👥 Admin panel: http://${VPS_IP}/admin${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi
