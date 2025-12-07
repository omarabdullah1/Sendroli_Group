# 🚀 Server Port Conflict Resolution

## Problem
Port 80 was already in use on the server, preventing the frontend container from starting.

## Solution Implemented

### 1. **Fixed Docker Compose Configuration**
- Frontend container now runs on port 3000 internally
- Added dedicated Nginx container for port 80/443
- Nginx acts as reverse proxy for both frontend and backend

### 2. **Created Nginx Configuration**
- Location: `nginx/nginx.conf`
- Features:
  - Reverse proxy for frontend and backend
  - API rate limiting
  - CORS headers
  - Gzip compression
  - Health check endpoint
  - SSL ready (commented out, configure when certificates available)

### 3. **Created Deployment Fix Script**
- Location: `fix-server-deployment.sh`
- Automatically handles:
  - Stopping system nginx if running
  - Stopping conflicting Docker containers
  - Cleaning up Docker resources
  - Building and starting containers
  - Verifying services
  - Showing logs for troubleshooting

## 📋 Deployment Steps

### On Your Server (srv1134605):

```bash
# 1. Pull the latest changes
cd /opt/Sendroli_Group
git pull origin main

# 2. Run the deployment fix script
sudo ./fix-server-deployment.sh
```

The script will:
- ✅ Stop any service using port 80
- ✅ Clean up old containers
- ✅ Build and start all services properly
- ✅ Verify everything is working
- ✅ Show you the logs

## 🔍 Manual Steps (if needed)

If you prefer to do it manually:

```bash
# 1. Stop system nginx (if running)
sudo systemctl stop nginx
sudo systemctl disable nginx

# 2. Stop existing containers
cd /opt/Sendroli_Group
docker-compose -f docker-compose.prod.yml down

# 3. Start with new configuration
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans
```

## ✅ Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl http://localhost/health        # Nginx health
curl http://localhost/api/health    # Backend health (via nginx)
curl http://localhost:5000/api/health  # Backend health (direct)
```

## 🌐 Access Your Application

- **Frontend**: http://YOUR_SERVER_IP
- **Backend API**: http://YOUR_SERVER_IP/api
- **Backend Direct**: http://YOUR_SERVER_IP:5000/api

## 🔐 Next Steps

1. **Configure SSL Certificates** (for HTTPS)
   - Uncomment HTTPS server block in `nginx/nginx.conf`
   - Add SSL certificates to `nginx/ssl/` directory
   - Update server_name with your domain

2. **Secure MongoDB**
   - Update `mongodb/.env` with strong password
   - Ensure MongoDB is not exposed to internet

3. **Update Backend Environment**
   - Verify `backend/.env.production` has correct values
   - Update CORS_ORIGIN if needed

## 📁 New Files Created

- `nginx/nginx.conf` - Nginx reverse proxy configuration
- `nginx/ssl/` - Directory for SSL certificates
- `nginx/logs/` - Nginx logs directory
- `fix-server-deployment.sh` - Automated deployment script

## 🛠️ Architecture

```
Internet (Port 80/443)
        ↓
    Nginx Container
        ↓
    ├─→ Frontend Container (Port 3000)
    └─→ Backend Container (Port 5000)
            ↓
        MongoDB Container (Port 27017)
```

## 📞 Troubleshooting

If containers fail to start:

```bash
# Check what's using port 80
sudo lsof -i :80

# View container logs
docker logs sendroli-nginx
docker logs sendroli-backend
docker logs sendroli-frontend
docker logs sendroli-mongodb

# Restart specific service
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔄 Common Commands

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```
