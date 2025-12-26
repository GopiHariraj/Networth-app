# Deploy Networth App to Google Cloud Platform (VPS)updated

This guide walks you through deploying your networth application on Google Cloud Platform using Compute Engine (Virtual Private Server).

## Overview

You'll deploy using:
- **Google Compute Engine** VM instance (VPS)
- **Docker Compose** for container orchestration
- **Nginx** as reverse proxy
- **Let's Encrypt** for SSL certificates

**Estimated Cost**: $10-30/month depending on instance size

---

## Prerequisites

- [ ] Google Cloud Platform account ([Sign up here](https://cloud.google.com/))
- [ ] $300 free credit for new users (valid for 90 days)
- [ ] Domain name (optional but recommended)
- [ ] GitHub repository with your code

---

## Step 1: Create Google Cloud VM Instance

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Compute Engine** → **VM instances**

### 1.2 Create VM Instance

Click **"Create Instance"** and configure:

**Basic Configuration:**
- **Name**: `networth-app`
- **Region**: Choose closest to your users (e.g., `us-central1`, `asia-south1`)
- **Zone**: Any zone in your region

**Machine Configuration:**
- **Series**: E2
- **Machine type**: `e2-small` (2 vCPU, 2 GB RAM)
  - Start here; upgrade to `e2-medium` if needed

**Boot Disk:**
- Click **"Change"**
- **Operating System**: Ubuntu
- **Version**: Ubuntu 22.04 LTS
- **Boot disk type**: Balanced persistent disk
- **Size**: 20 GB (minimum)

**Firewall:**
- ✅ Allow HTTP traffic
- ✅ Allow HTTPS traffic

Click **"Create"** and wait for the instance to start.

### 1.3 Configure Firewall Rules

1. Go to **VPC Network** → **Firewall**
2. Click **"Create Firewall Rule"**
3. Configure:
   - **Name**: `allow-app-ports`
   - **Targets**: All instances in the network
   - **Source IP ranges**: `0.0.0.0/0`
   - **Protocols and ports**: 
     - `tcp:80` (HTTP)
     - `tcp:443` (HTTPS)
     - `tcp:3000` (Frontend - for testing)
     - `tcp:3001` (Backend - for testing)

> [!NOTE]
> Ports 3000 and 3001 are for initial testing. You'll remove them later when using Nginx.

---

## Step 2: Connect to Your VM

### Option A: Browser SSH (Easiest)

1. In VM instances list, click **"SSH"** button next to your instance
2. A browser window will open with terminal access

### Option B: Local Terminal (Recommended)

```bash
# Install Google Cloud SDK
# macOS:
brew install --cask google-cloud-sdk

# Initialize and authenticate
gcloud init
gcloud auth login

# SSH into your instance
gcloud compute ssh networth-app --zone=YOUR_ZONE
```

---

## Step 3: Install Required Software

Once connected to your VM, run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoid using sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Verify installations
docker --version
docker-compose --version
git --version
node -v
npm -v
nginx -v

# Logout and login again for docker group to take effect
exit
```

> [!NOTE]
> Technically, if you are using Docker, Node.js is not strictly required on the host VM as the application runs inside containers. However, installing it on the host is highly recommended for debugging, running database scripts, or using tools like Prisma Studio locally.

Re-connect to your VM after logging out.

---

## Step 4: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/networth-app.git
cd networth-app

# Verify files
ls -la
```

---

## Step 5: Configure Environment Variables

### 5.1 Create Production Environment File

```bash
# Copy example env file
cp .env.example .env

# Edit with nano or vim
nano .env
```

### 5.2 Set Production Values

Update your `.env` file with secure values:

```bash
# Database Configuration
DB_ROOT_PASSWORD=YOUR_SUPER_SECURE_ROOT_PASSWORD
DB_NAME=networth
DB_USER=networth_user
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
DB_PORT=3306

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_32_CHARS_MIN 4H3NC7tELiT9EaBV8onaF4gS7sGqUzbu35RRhHoYauw=
JWT_REFRESH_SECRET=YOUR_SUPER_SECRET_REFRESH_KEY_32_CHARS_MIN
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://YOUR_VM_EXTERNAL_IP:3001/api
# Or if using domain: https://yourdomain.com/api
```

> [!IMPORTANT]
> Generate strong secrets using:
> ```bash
> openssl rand -base64 32
> ```
http://34.46.102.166:3001/api
http://35.223.105.239:3001/api

**To get your VM's external IP:**
```bash
curl ifconfig.me
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 6: Create Production Docker Compose File

Create a production-optimized Docker Compose configuration:

```bash
nano docker-compose.prod.yml
```

Add this configuration:

```yaml
version: '3.8'

services:
  # MariaDB Database
  db:
    image: mariadb:10.11
    container_name: networth-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - networth-network
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API (NestJS)
  backend:
    build:
      context: ./networth-backend
      dockerfile: Dockerfile
      target: production
    container_name: networth-backend
    restart: always
    environment:
      DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@db:3306/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - networth-network

  # Frontend (Next.js)
  frontend:
    build:
      context: ./networth-frontend
      dockerfile: Dockerfile
      target: production
    container_name: networth-frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - networth-network

volumes:
  db_data:
    driver: local

networks:
  networth-network:
    driver: bridge
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

---

## Step 7: Update Dockerfiles for Production

### 7.1 Backend Dockerfile

Check if your backend Dockerfile has a production stage:

```bash
cat networth-backend/Dockerfile
```

If it doesn't have multi-stage builds, update it:

```bash
nano networth-backend/Dockerfile
```

```dockerfile
# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### 7.2 Frontend Dockerfile

```bash
nano networth-frontend/Dockerfile
```

```dockerfile
# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

> [!NOTE]
> For the frontend production stage to work, ensure `next.config.js` has:
> ```javascript
> output: 'standalone'
> ```

---

## Step 8: Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# This will:
# 1. Build Docker images
# 2. Create containers
# 3. Start all services in background

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# To stop watching logs, press Ctrl+C
```

---

## Step 9: Run Database Migrations

```bash
# Run Prisma migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# (Optional) Seed initial data
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## Step 10: Test Your Application

### 10.1 Access via IP

Visit in your browser:
- **Frontend**: `http://YOUR_VM_EXTERNAL_IP:3000`
- **Backend API**: `http://YOUR_VM_EXTERNAL_IP:3001/api`

### 10.2 Test API Health

```bash
# From your local machine or VM
curl http://YOUR_VM_EXTERNAL_IP:3001/api/auth/health

# Should return: {"status":"ok"}
```

---

## Step 11: Set Up Nginx Reverse Proxy (Optional but Recommended)

### 11.1 Why Use Nginx?

- Single entry point (port 80/443)
- SSL termination
- Better performance
- Load balancing capability

### 11.2 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/networth
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

### 11.3 Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/networth /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 11.4 Update Environment Variables

If using Nginx, update your `.env`:

```bash
nano .env
```

Change:
```bash
NEXT_PUBLIC_API_URL=http://YOUR_IP/api
# Or with domain: https://yourdomain.com/api
```

Restart containers:
```bash
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## Step 12: Set Up SSL with Let's Encrypt (For Domain Names)

> [!IMPORTANT]
> This step requires a domain name pointing to your VM's IP address.

### 12.1 Point Domain to VM

1. In your domain registrar (GoDaddy, Namecheap, etc.)
2. Create an **A record**:
   - **Host**: `@` (or `www`)
   - **Value**: Your VM's external IP
   - **TTL**: 3600

Wait 5-10 minutes for DNS propagation.

### 12.2 Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain and install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect option (recommended: 2)
```

### 12.3 Auto-Renewal

Certbot automatically sets up auto-renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run
```

### 12.4 Update Environment for HTTPS

```bash
nano .env
```

```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

Restart:
```bash
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## Step 13: Create Initial Admin User

Since your app doesn't have a signup page, create an admin user:

```bash
# Access the backend container
docker-compose -f docker-compose.prod.yml exec backend sh

# Inside container, create seed scriptcat > create-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await argon2.hash('YourSecurePassword123!');
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      currency: 'AED',
    },
  });
  
  console.log('✅ Created admin user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

# Run the script
node create-admin.js

# Exit container
exit
```

---

## Step 14: Set Up Monitoring and Backups

### 14.1 View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db
```

### 14.2 Database Backups

Create a backup script:

```bash
nano backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec -T db mysqldump \
  -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} \
  > $BACKUP_DIR/networth_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "networth_backup_*.sql" -mtime +7 -delete

echo "✅ Backup completed: networth_backup_$DATE.sql"
```

Make executable and set up cron:

```bash
chmod +x backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/$USER/networth-app/backup-db.sh >> /home/$USER/backup.log 2>&1
```

### 14.3 Monitor Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df
```

---

## Step 15: Maintenance Commands

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if schema changed
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (BE CAREFUL!)
docker volume prune

# Clean everything (BE VERY CAREFUL!)
docker system prune -a --volumes
```

### Stop Application

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (deletes database!)
docker-compose -f docker-compose.prod.yml down -v
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if port is in use
sudo lsof -i :3000
sudo lsof -i :3001
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose -f docker-compose.prod.yml ps

# Test database connection
docker-compose -f docker-compose.prod.yml exec db mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME}
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Out of Memory

Upgrade VM instance type:
1. Go to Google Cloud Console
2. Stop VM instance
3. Click **"Edit"**
4. Change machine type to `e2-medium`
5. Start instance

---

## Security Checklist

- [ ] Strong passwords in `.env` file
- [ ] `.env` file not committed to Git (in `.gitignore`)
- [ ] Firewall rules properly configured
- [ ] SSL certificate installed (for domains)
- [ ] Database backups automated
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Monitor application logs regularly
- [ ] Change default ports (optional)
- [ ] Set up fail2ban (optional but recommended)

---

## Cost Optimization

**Current setup (~$10-30/month):**
- e2-small: ~$13/month
- 20 GB disk: ~$2/month
- Network egress: varies

**To reduce costs:**
1. Use **preemptible VMs** (up to 80% cheaper, but can be terminated)
2. Stop VM when not in use
3. Use **Cloud Run** instead (serverless, pay per request)
4. Monitor usage in **Billing Dashboard**

---

## Quick Reference

### Common Commands

```bash
# Start application
docker-compose -f docker-compose.prod.yml up -d

# Stop application
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Update code
git pull && docker-compose -f docker-compose.prod.yml up -d --build
```

### Access URLs

- **Frontend**: `http://YOUR_IP:3000` or `https://yourdomain.com`
- **Backend API**: `http://YOUR_IP:3001/api` or `https://yourdomain.com/api`
- **Prisma Studio**: `docker-compose -f docker-compose.prod.yml exec backend npx prisma studio`

---

## Next Steps

1. **Test thoroughly** before sharing with users
2. Set up **monitoring** (Google Cloud Monitoring, UptimeRobot)
3. Configure **automated backups** 
4. Consider **CDN** for static assets (Cloud CDN)
5. Set up **CI/CD** pipeline (GitHub Actions → Google Cloud)

---

## Support

**Google Cloud Documentation:**
- [Compute Engine Docs](https://cloud.google.com/compute/docs)
- [VM Instance Pricing](https://cloud.google.com/compute/vm-instance-pricing)
- [Free Tier](https://cloud.google.com/free)

**Useful Links:**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

Good luck with your deployment! 🚀

If you run into issues, check the logs first, then consult the troubleshooting section.
