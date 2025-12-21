#!/bin/bash

# Fix Login Failed Issue - Complete Solution
# Run this script on your Google Cloud VM

set -e

echo "🔧 Fixing Login Failed Issue..."
echo "================================"
echo ""

# Step 1: Stop current containers
echo "Step 1: Stopping current containers..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✅ Containers stopped"
echo ""

# Step 2: Pull latest code
echo "Step 2: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 3: Clean up old images
echo "Step 3: Removing old images..."
docker image rm networth-app-backend 2>/dev/null || true
docker image rm networth-app-frontend 2>/dev/null || true
echo "✅ Old images removed"
echo ""

# Step 4: Build with production config
echo "Step 4: Building containers (this takes 3-5 minutes)..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo "✅ Build complete"
echo ""

# Step 5: Start containers
echo "Step 5: Starting containers..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Containers started"
echo ""

# Step 6: Wait for services
echo "Step 6: Waiting for services to initialize (30 seconds)..."
sleep 30
echo "✅ Wait complete"
echo ""

# Step 7: Check status
echo "Step 7: Checking container status..."
echo "===================================="
docker-compose -f docker-compose.prod.yml ps
echo ""

# Step 8: Show backend logs
echo "Step 8: Backend logs (last 30 lines)..."
echo "========================================"
docker-compose -f docker-compose.prod.yml logs --tail=30 networth-backend
echo ""

# Step 9: Test backend health
echo "Step 9: Testing backend health..."
echo "================================="
sleep 5

# Try to reach backend
if curl -s http://localhost:3001/ > /dev/null; then
    echo "✅ Backend is responding!"
else
    echo "❌ Backend not responding - check logs above"
fi
echo ""

# Step 10: Final status
echo "🎉 Fix Complete!"
echo "================"
echo ""
echo "📋 Next Steps:"
echo "1. Check container status above - all should show 'Up'"
echo "2. Test login at: http://34.16.36.153/login"
echo "3. Use credentials:"
echo "   - Email: admin@fortstec.com"
echo "   - Password: Forts@123"
echo ""
echo "💡 If login still fails, run:"
echo "   docker-compose -f docker-compose.prod.yml logs networth-backend"
echo ""
