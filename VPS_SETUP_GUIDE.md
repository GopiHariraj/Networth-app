# 🚀 VPS Initial Setup & Deployment Guide

## Current Issue
The project is not in the expected location (`~/networth-app`) on your VPS.

---

## Step 1: Find Existing Installation

Run these commands on your VPS to locate the current installation:

```bash
# Check if project exists anywhere
find ~ -name "docker-compose.prod.yml" 2>/dev/null

# Check what's running
docker ps

# Check all docker compose projects
docker ps --format "{{.Names}}"
```

---

## Step 2: Fresh Setup (Recommended)

### A. Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone from GitHub
git clone https://github.com/GopiHariraj/Networth-app.git networth-app

# Enter directory
cd networth-app

# Verify files are present
ls -la
```

Expected files:
- `docker-compose.prod.yml`
- `networth-backend/`
- `networth-frontend/`
- `.env.production` (or create it)

### B. Create Environment Files

```bash
# Create .env.production for frontend
cat > networth-frontend/.env.production << 'EOF'
# Production Environment Variables
NEXT_PUBLIC_API_URL=http://34.16.36.153/api
NODE_ENV=production
EOF

# Create .env for backend (if not exists)
cat > networth-backend/.env << 'EOF'
# Database Configuration
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=networth
DB_USER=networth_user
DB_PASSWORD=secure_password_123
DB_ROOT_PASSWORD=root_password_123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Application
NODE_ENV=production
PORT=3001
EOF
```

### C. Deploy Application

```bash
# Build and start all containers
docker-compose -f docker-compose.prod.yml up -d --build

# Wait 30 seconds for services to start
sleep 30

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

---

## Step 3: If Installation Exists Elsewhere

If `docker ps` shows containers running, find where they are:

```bash
# Get container details
docker inspect $(docker ps -q) | grep -i workingdir

# Or check docker compose project location
docker inspect $(docker ps -q --filter name=networth) | grep com.docker.compose.project.working_dir
```

Then navigate to that directory and run:

```bash
cd <that-directory>
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Step 4: Verify Deployment

### Check Containers
```bash
docker ps
```

Expected output (3 containers):
- `networth-app-networth-frontend-1`
- `networth-app-networth-backend-1`
- `networth-app-mariadb-1`

### Check Backend Logs
```bash
cd ~/networth-app
docker-compose -f docker-compose.prod.yml logs networth-backend | tail -50
```

Look for:
- ✅ "Nest application successfully started"
- ✅ "Listening on port 3001"
- ❌ Any error messages

### Check Frontend Logs
```bash
docker-compose -f docker-compose.prod.yml logs networth-frontend | tail -50
```

### Test API Directly
```bash
# Test backend health
curl http://localhost:3001/

# Test via Nginx
curl http://localhost/api/
```

---

## Step 5: Test in Browser

After deployment, test these URLs:

1. **Homepage:** http://34.16.36.153/
2. **Login:** http://34.16.36.153/login
3. **Settings:** http://34.16.36.153/settings

**Login with:**
- Email: `admin@fortstec.com`
- Password: `Forts@123`

---

## Troubleshooting

### If backend won't start:

```bash
# Check backend logs in detail
docker logs networth-app-networth-backend-1

# Check if database is ready
docker logs networth-app-mariadb-1

# Restart backend
docker-compose -f docker-compose.prod.yml restart networth-backend
```

### If database connection fails:

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs mariadb

# Verify database credentials match
cat networth-backend/.env
```

### Nuclear option (complete reset):

```bash
cd ~/networth-app
docker-compose -f docker-compose.prod.yml down -v
docker system prune -af --volumes
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Quick Status Check Script

Save this as `check-status.sh`:

```bash
#!/bin/bash
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Backend Health ==="
curl -s http://localhost:3001/ || echo "Backend not responding"

echo -e "\n=== Frontend Health ==="
curl -s http://localhost:3000/ | head -20 || echo "Frontend not responding"

echo -e "\n=== Nginx Health ==="
curl -s http://localhost/ | head -20 || echo "Nginx not responding"

echo -e "\n=== Recent Backend Logs ==="
docker logs networth-app-networth-backend-1 --tail=10 2>&1
```

Run with: `bash check-status.sh`

---

## Next Steps

After running the setup, please share the output of:

```bash
cd ~/networth-app
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50 networth-backend
```

This will help me diagnose any remaining issues!
