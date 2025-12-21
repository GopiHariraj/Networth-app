# 🚀 Quick Fix Guide - Deploy Latest Changes to VPS

**Issue:** Backend API returning 502 Bad Gateway  
**Solution:** Deploy the latest code with login/admin features to VPS

---

## Option 1: Using Google Cloud Console (Recommended)

### Step 1: Access Your VPS
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Compute Engine** → **VM instances**
3. Find your instance (IP: `34.16.36.153`)
4. Click **SSH** button to open browser terminal

### Step 2: Run Deployment Commands

Copy and paste these commands **one at a time** into the SSH terminal:

```bash
# Navigate to project
cd ~/networth-app

# Pull latest code
git pull origin main

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Remove old images
docker image rm networth-app-networth-frontend:latest || true
docker image rm networth-app-networth-backend:latest || true

# Rebuild images (takes 3-5 minutes)
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Wait 15 seconds
sleep 15

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### Step 3: Verify Deployment

After running the commands, test these URLs:
- ✅ Login: http://34.16.36.153/login
- ✅ Homepage: http://34.16.36.153/
- ✅ Admin: http://34.16.36.153/admin

**Demo Credentials:**
- Email: `admin@fortstec.com`
- Password: `Forts@123`

---

## Option 2: Using Deployment Script

### On Your VPS (via Google Cloud Console SSH):

```bash
cd ~/networth-app
curl -O https://raw.githubusercontent.com/GopiHariraj/Networth-app/main/deploy-on-vps.sh
chmod +x deploy-on-vps.sh
./deploy-on-vps.sh
```

---

## Troubleshooting

### If containers fail to start:

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs networth-backend
docker-compose -f docker-compose.prod.yml logs networth-frontend

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Check if ports are in use
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :3000
```

### If database connection fails:

```bash
# Check database container
docker-compose -f docker-compose.prod.yml ps mariadb

# Restart database
docker-compose -f docker-compose.prod.yml restart mariadb
```

### If still having issues:

```bash
# Full cleanup and restart
docker-compose -f docker-compose.prod.yml down -v
docker system prune -af
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## What's Being Fixed

**New Features Added:**
1. ✅ Responsive login page with glassmorphism design
2. ✅ Admin panel with user management
3. ✅ Search and filter users
4. ✅ Edit user details and roles
5. ✅ Enable/disable users
6. ✅ Proper JWT authentication

**Backend Changes:**
- Updated auth context with API integration
- Fixed API URL configuration
- Added user management endpoints

---

## Quick Status Check

After deployment, verify services are running:

```bash
docker ps
# Should show 3 containers: frontend, backend, mariadb
```

Expected output:
```
CONTAINER ID   IMAGE                              STATUS
xxxxx          networth-app-networth-frontend     Up X minutes
xxxxx          networth-app-networth-backend      Up X minutes  
xxxxx          mariadb:10.11                      Up X minutes
```

---

## Need Help?

If deployment fails, share the output of:
```bash
docker-compose -f docker-compose.prod.yml logs --tail=100
```
