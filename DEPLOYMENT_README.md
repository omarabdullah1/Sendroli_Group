# 🚀 Ubuntu Server Deployment - Complete Package

## 📦 What's Included

This deployment package includes everything you need to deploy your complete Sendroli Factory Management System on your Ubuntu server, **removing all dependencies on Vercel and other external platforms**.

### ✅ What You Get
- ✅ **Complete Docker Setup**: Backend + Frontend + MongoDB
- ✅ **Automated Deployment**: One-script installation
- ✅ **Production Ready**: Optimized configurations
- ✅ **Security Hardened**: Firewall, secrets management
- ✅ **Platform Independent**: No Vercel, no external dependencies
- ✅ **Easy Management**: Simple commands for maintenance

---

## 🎯 Quick Start (3 Steps)

### Step 1: Prepare Your Project (On Your Mac)
```bash
cd /Users/root1/Sendroli_Group

# Clean up Vercel and platform-specific files
./cleanup-vercel.sh
```

### Step 2: Transfer to Server (On Your Mac)
```bash
# Option A: Use automated transfer script (Recommended)
./transfer-to-server.sh

# Option B: Manual transfer
scp -r /Users/root1/Sendroli_Group root@YOUR_SERVER_IP:/opt/
```

### Step 3: Deploy on Server (On Your Ubuntu Server)
```bash
ssh root@YOUR_SERVER_IP
cd /opt/Sendroli_Group
./deploy-to-ubuntu.sh
```

**That's it! 🎉 Your system is now live!**

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **QUICK_DEPLOY.md** | Quick reference guide |
| **UBUNTU_SERVER_DEPLOYMENT.md** | Complete deployment documentation |
| **cleanup-vercel.sh** | Remove Vercel-specific files |
| **transfer-to-server.sh** | Transfer project to server |
| **deploy-to-ubuntu.sh** | Automated deployment script |

---

## 🔧 Scripts Overview

### 1. cleanup-vercel.sh
**Purpose**: Removes all Vercel and platform-specific files

**What it does**:
- Removes `.vercel/` directories
- Removes `vercel.json` files
- Cleans git cache
- Updates `.gitignore`
- Creates backups of modified files

**Usage**:
```bash
./cleanup-vercel.sh
```

### 2. transfer-to-server.sh
**Purpose**: Transfers your project to Ubuntu server

**What it does**:
- Tests SSH connection
- Packages project (excludes node_modules, etc.)
- Transfers via SCP
- Extracts on server
- Sets proper permissions

**Usage**:
```bash
./transfer-to-server.sh
# Follow the prompts
```

### 3. deploy-to-ubuntu.sh
**Purpose**: Complete automated deployment on Ubuntu server

**What it does**:
- Installs Docker & Docker Compose
- Installs Git
- Configures firewall
- Creates environment files
- Generates secure passwords
- Builds Docker images
- Starts all services
- Seeds database
- Saves credentials

**Usage**:
```bash
# On your Ubuntu server
cd /opt/Sendroli_Group
./deploy-to-ubuntu.sh
```

---

## 🌟 What Changed from Vercel

### Before (Vercel)
```
❌ Frontend deployed separately on Vercel
❌ Backend deployed separately on Vercel
❌ Database on MongoDB Atlas (external)
❌ Separate deployments
❌ Vercel-specific configurations
❌ Platform lock-in
```

### After (Ubuntu Server)
```
✅ All services on your server
✅ Single unified deployment
✅ Local MongoDB in Docker
✅ Complete control
✅ No platform dependencies
✅ Cost effective
✅ Easy to scale
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│          Your Ubuntu Server                     │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Docker Network: sendroli-network        │  │
│  │                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐│  │
│  │  │ Frontend │  │ Backend  │  │MongoDB ││  │
│  │  │  :80     │  │  :5000   │  │ :27017 ││  │
│  │  │  Nginx   │  │ Node.js  │  │        ││  │
│  │  └──────────┘  └──────────┘  └────────┘│  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Exposed Ports:                                │
│  - 80 (Frontend)                               │
│  - 5000 (Backend API)                          │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Firewall Configuration**: UFW with only necessary ports open
2. **Secure Passwords**: Auto-generated strong passwords
3. **Docker Isolation**: Services isolated in Docker network
4. **Non-root Containers**: Containers run as non-root users
5. **Environment Variables**: Secrets in environment files
6. **MongoDB Authentication**: Username/password required

---

## 📊 Services Overview

### Frontend (Port 80)
- **Technology**: React + Vite
- **Server**: Nginx
- **Container**: sendroli-frontend
- **Auto-restart**: Yes

### Backend (Port 5000)
- **Technology**: Node.js + Express
- **Container**: sendroli-backend
- **Health Check**: /api/health endpoint
- **Auto-restart**: Yes

### Database (Port 27017)
- **Technology**: MongoDB 6.0
- **Container**: sendroli-mongodb
- **Persistence**: Docker volume (mongodb_data)
- **Auto-restart**: Yes
- **Authentication**: Enabled

---

## 🎯 Post-Deployment

### Access Your Application
```
Frontend: http://YOUR_SERVER_IP
Backend API: http://YOUR_SERVER_IP:5000/api
Health Check: http://YOUR_SERVER_IP:5000/api/health
```

### Default Users
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| receptionist | recep123 | Receptionist |
| designer | design123 | Designer |
| worker | worker123 | Worker |
| financial | finance123 | Financial |

**⚠️ Change all passwords immediately after first login!**

### View Your Credentials
```bash
cat /opt/Sendroli_Group/CREDENTIALS.txt
```

---

## 🔄 Common Operations

### View Logs
```bash
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Stop Services
```bash
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml down
```

### Start Services
```bash
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml up -d
```

### Restart Service
```bash
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
```

### Update Application
```bash
cd /opt/Sendroli_Group
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup
docker exec sendroli-mongodb mongodump \
  -u admin -p YOUR_PASSWORD \
  --authenticationDatabase admin \
  -o /data/backup

# Copy to host
docker cp sendroli-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

---

## 🌐 Optional: Setup Domain & SSL

### Prerequisites
- Domain name pointing to your server IP
- Ports 80 and 443 open

### Quick Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/Sendroli_Group/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/Sendroli_Group/nginx/ssl/

# Update environment files
# Edit backend/.env.production: FRONTEND_URL=https://yourdomain.com
# Edit frontend/.env.production: VITE_API_URL=https://yourdomain.com/api

# Restart services
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml restart
```

See **UBUNTU_SERVER_DEPLOYMENT.md** for detailed SSL setup.

---

## 🆘 Troubleshooting

### Container Won't Start
```bash
docker compose -f docker-compose.prod.yml logs [service-name]
docker ps -a
```

### Port Already in Use
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000
```

### Cannot Access Frontend
```bash
# Check firewall
sudo ufw status

# Check container
docker ps | grep frontend
docker logs sendroli-frontend
```

### Database Connection Failed
```bash
# Check MongoDB
docker logs sendroli-mongodb

# Verify credentials in backend/.env.production
cat backend/.env.production | grep MONGODB_URI
```

---

## 📊 Monitoring

### Check Resources
```bash
# Container stats
docker stats

# System resources
htop  # Install: sudo apt install htop

# Disk usage
df -h
du -sh /opt/Sendroli_Group/*
```

### Check Service Health
```bash
# Frontend
curl http://localhost:80

# Backend
curl http://localhost:5000/api/health

# All services
docker compose -f docker-compose.prod.yml ps
```

---

## ✅ Deployment Checklist

- [ ] Cleaned Vercel files (`./cleanup-vercel.sh`)
- [ ] Transferred to server (`./transfer-to-server.sh`)
- [ ] Deployed on server (`./deploy-to-ubuntu.sh`)
- [ ] All containers running (`docker ps`)
- [ ] Frontend accessible via browser
- [ ] Backend API responding (`/api/health`)
- [ ] Can login with admin credentials
- [ ] Changed all default passwords
- [ ] Saved credentials securely
- [ ] Firewall configured
- [ ] Backup system planned
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) Domain configured

---

## 🎓 Learning Resources

### Understanding Docker
- **What**: Containerization platform
- **Why**: Consistent environments, easy deployment
- **Commands**: `docker ps`, `docker logs`, `docker exec`

### Understanding Docker Compose
- **What**: Multi-container orchestration
- **Why**: Manage multiple services together
- **File**: `docker-compose.prod.yml`

### Key Concepts
- **Container**: Isolated application environment
- **Image**: Template for containers
- **Volume**: Persistent data storage
- **Network**: Container communication

---

## 📞 Support

### Need Help?
1. Check logs: `docker compose logs -f`
2. Review documentation: `UBUNTU_SERVER_DEPLOYMENT.md`
3. Check service status: `docker ps`
4. Verify environment files exist and are correct

### Documentation
- **Quick Guide**: QUICK_DEPLOY.md
- **Full Guide**: UBUNTU_SERVER_DEPLOYMENT.md
- **Main README**: README.md

---

## 🎉 Success!

If all containers are running and you can access your application:

```bash
docker ps
```

You should see:
- ✅ sendroli-frontend (running)
- ✅ sendroli-backend (running)
- ✅ sendroli-mongodb (running)

**Congratulations! Your Sendroli Factory Management System is live! 🚀**

Access it at: `http://YOUR_SERVER_IP`

---

**Questions? Issues? Check UBUNTU_SERVER_DEPLOYMENT.md for detailed troubleshooting!**
