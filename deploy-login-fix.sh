#!/bin/bash
# Quick deployment script for networth app login fix

echo "🚀 Deploying login authentication fixes..."

# Navigate to project directory
cd ~/Networth-app || { echo "Error: Networth-app directory not found"; exit 1; }

# Pull latest code changes
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Create .env.production file in frontend directory
echo "📝 Creating production environment file..."
cat > networth-frontend/.env.production << 'EOF'
# Production API URL - uses port 80 with /api path (reverse proxy)
NEXT_PUBLIC_API_URL=http://35.223.105.239/api
EOF

echo "✅ Created .env.production with API URL: http://35.223.105.239/api"

# Rebuild containers
echo "🔨 Rebuilding Docker containers..."
docker-compose down
docker-compose up -d --build

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 30

# Check container status
echo "📊 Container status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should now be accessible at: http://35.223.105.239"
echo "🔐 Login with: admin@fortstec.com / Forts@123"
echo ""
echo "To check logs if there are issues:"
echo "  docker-compose logs frontend --tail=50"
echo "  docker-compose logs backend --tail=50"
