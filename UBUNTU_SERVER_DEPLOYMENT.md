# 🚀 Ubuntu Server Deployment Guide - Sendroli Factory Management System

## 📋 Overview
This guide will help you deploy the complete Sendroli Factory Management System (frontend + backend + database) on your Ubuntu server using Docker.

---

## 🎯 Prerequisites

### On Your Local Machine
- Git installed
- SSH access to your Ubuntu server
- This project cloned

### On Your Ubuntu Server
- Ubuntu 20.04 LTS or newer
- Minimum 2GB RAM, 20GB disk space
- Root or sudo access
- Domain name (optional, but recommended)

---

## 📦 Step 1: Prepare Your Ubuntu Server

### 1.1 Connect to Your Server
```bash
ssh root@YOUR_SERVER_IP
# or if you have a non-root user with sudo access
ssh your_username@YOUR_SERVER_IP
```

### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, avoids using sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 1.4 Install Git
```bash
sudo apt install git -y
git --version
```

### 1.5 Configure Firewall
```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MongoDB (optional, only if accessing externally)
# sudo ufw allow 27017/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## 🔧 Step 2: Deploy Application to Server

### 2.1 Clone Repository on Server
```bash
cd /opt
sudo git clone https://github.com/omarabdullah1/Sendroli_Group.git
cd Sendroli_Group

# Set proper permissions
sudo chown -R $USER:$USER /opt/Sendroli_Group
```

### 2.2 Create Production Environment Files

#### Backend Environment (.env.production)
```bash
cd /opt/Sendroli_Group/backend
nano .env.production
```

Add this content (replace with your values):
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://admin:your_secure_mongodb_password@mongodb:27017/factory_management?authSource=admin

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long_random_string
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://YOUR_SERVER_IP
# Or if you have a domain:
# FRONTEND_URL=https://yourdomain.com

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

#### Frontend Environment (.env.production)
```bash
cd /opt/Sendroli_Group/frontend
nano .env.production
```

Add this content:
```env
# API Configuration
VITE_API_URL=http://YOUR_SERVER_IP:5000/api
# Or if you have a domain:
# VITE_API_URL=https://yourdomain.com/api

# App Configuration
VITE_APP_NAME=Sendroli Factory Management
```

#### MongoDB Environment
```bash
cd /opt/Sendroli_Group
mkdir -p mongodb
nano mongodb/.env
```

Add this content:
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_mongodb_password
MONGO_INITDB_DATABASE=factory_management
```

---

## 🐳 Step 3: Build and Deploy with Docker

### 3.1 Build Docker Images
```bash
cd /opt/Sendroli_Group

# Build all services
docker compose -f docker-compose.prod.yml build

# This will build:
# - Backend Node.js application
# - Frontend React application with Nginx
# - MongoDB database
```

### 3.2 Start All Services
```bash
# Start in detached mode
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check running containers
docker ps
```

### 3.3 Verify Services
```bash
# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:80

# Check MongoDB connection
docker exec -it sendroli-mongodb mongosh -u admin -p your_secure_mongodb_password --authenticationDatabase admin
```

---

## 🔐 Step 4: Initialize Database

### 4.1 Seed Initial Data (Optional)
```bash
cd /opt/Sendroli_Group/backend

# Run seed script inside backend container
docker exec -it sendroli-backend npm run seed
```

This will create default users:
- **Admin:** username: `admin`, password: `admin123`
- **Receptionist:** username: `receptionist`, password: `recep123`
- **Designer:** username: `designer`, password: `design123`
- **Worker:** username: `worker`, password: `worker123`
- **Financial:** username: `financial`, password: `finance123`

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

---

## 🌐 Step 5: Access Your Application

### Without Domain
- **Frontend:** http://YOUR_SERVER_IP
- **Backend API:** http://YOUR_SERVER_IP:5000/api

### With Domain (Recommended)
See "Optional: Domain Setup with SSL" section below.

---

## 🔄 Step 6: Manage Your Application

### Start/Stop Services
```bash
cd /opt/Sendroli_Group

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
```

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f mongodb
```

### Update Application
```bash
cd /opt/Sendroli_Group

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup directory
mkdir -p /opt/backups/mongodb

# Backup MongoDB
docker exec sendroli-mongodb mongodump \
  --username admin \
  --password your_secure_mongodb_password \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup to host
docker cp sendroli-mongodb:/data/backup /opt/backups/mongodb/backup-$(date +%Y%m%d-%H%M%S)
```

### Restore Database
```bash
# Restore from backup
docker exec sendroli-mongodb mongorestore \
  --username admin \
  --password your_secure_mongodb_password \
  --authenticationDatabase admin \
  /data/backup
```

---

## 🌍 Optional: Domain Setup with SSL

### Install Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Create Nginx Configuration
```bash
sudo nano /opt/Sendroli_Group/nginx/nginx.conf
```

Add this configuration:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Get SSL Certificate
```bash
# Obtain certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx folder
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/Sendroli_Group/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/Sendroli_Group/nginx/ssl/

# Set proper permissions
sudo chmod 644 /opt/Sendroli_Group/nginx/ssl/*.pem

# Restart services
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml restart nginx frontend
```

### Auto-Renew SSL Certificate
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal (runs twice daily)
sudo crontab -e
# Add this line:
0 0,12 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/Sendroli_Group/nginx/ssl/ && cd /opt/Sendroli_Group && docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 Monitoring and Maintenance

### Check Container Status
```bash
docker ps
docker stats
```

### Check Disk Space
```bash
df -h
du -sh /opt/Sendroli_Group/*
```

### Clean Up Docker
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune
```

### View System Resources
```bash
# Install htop if not available
sudo apt install htop -y
htop
```

---

## 🆘 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Check container status
docker ps -a

# Restart specific service
docker compose -f docker-compose.prod.yml restart [service-name]
```

### Cannot Connect to Frontend
```bash
# Check if port 80 is open
sudo netstat -tlnp | grep :80

# Check nginx logs
docker logs sendroli-frontend

# Check firewall
sudo ufw status
```

### Cannot Connect to Backend API
```bash
# Check if port 5000 is open
sudo netstat -tlnp | grep :5000

# Check backend logs
docker logs sendroli-backend

# Test backend health
curl http://localhost:5000/api/health
```

### Database Connection Issues
```bash
# Check MongoDB container
docker logs sendroli-mongodb

# Connect to MongoDB shell
docker exec -it sendroli-mongodb mongosh -u admin -p your_password --authenticationDatabase admin

# Check database
show dbs
use factory_management
show collections
```

---

## 🔒 Security Best Practices

1. **Change Default Passwords:** Update all default user passwords immediately
2. **Use Strong JWT Secret:** Generate a secure random string for JWT_SECRET
3. **Enable Firewall:** Only open necessary ports
4. **Use HTTPS:** Setup SSL certificate for production
5. **Regular Backups:** Schedule automated database backups
6. **Update System:** Keep Ubuntu and Docker updated
7. **Monitor Logs:** Regularly check application logs for issues
8. **Limit MongoDB Access:** Don't expose MongoDB port externally
9. **Use Environment Variables:** Never commit secrets to Git
10. **Setup Monitoring:** Consider tools like Prometheus/Grafana

---

## 📝 Quick Reference Commands

```bash
# Navigate to project
cd /opt/Sendroli_Group

# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart service
docker compose -f docker-compose.prod.yml restart [service-name]

# Update and redeploy
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Backup database
docker exec sendroli-mongodb mongodump -u admin -p password --authenticationDatabase admin -o /data/backup
docker cp sendroli-mongodb:/data/backup ./backup-$(date +%Y%m%d)

# Check status
docker ps
docker stats
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker compose logs -f [service-name]`
2. Verify environment variables are correctly set
3. Ensure firewall allows necessary ports
4. Check Docker and system resources
5. Review this documentation

---

## ✅ Post-Deployment Checklist

- [ ] All containers running (`docker ps`)
- [ ] Frontend accessible via browser
- [ ] Backend API responding (check `/api/health`)
- [ ] Can login with default admin credentials
- [ ] Changed all default passwords
- [ ] Database properly initialized
- [ ] Firewall configured correctly
- [ ] SSL certificate installed (if using domain)
- [ ] Backup system configured
- [ ] Monitoring setup

---

**🎉 Congratulations! Your Sendroli Factory Management System is now deployed!**

Access your application at: http://YOUR_SERVER_IP (or https://yourdomain.com)

Default admin login:
- Username: `admin`
- Password: `admin123` (CHANGE THIS IMMEDIATELY!)
