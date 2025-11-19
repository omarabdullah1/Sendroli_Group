# 📁 Deployment Files Overview

This document explains all the deployment-related files created for the Sendroli Factory Management System.

## 📋 Files Created

### 🐳 Docker Compose Files
- **`docker-compose.prod.yml`** - Production environment with all services
- **`docker-compose.dev.yml`** - Development environment for local testing

### 🔧 Environment Templates
- **`backend/.env.production.example`** - Backend production environment template
- **`frontend/.env.production.example`** - Frontend production environment template  
- **`mongodb/.env.example`** - MongoDB environment template

### 📜 Deployment Scripts
- **`scripts/setup-vps.sh`** - Complete VPS initial setup script
- **`scripts/deploy.sh`** - Full production deployment script
- **`scripts/quick-deploy.sh`** - Fast deployment for testing
- **`scripts/rollback.sh`** - Rollback to previous deployment

### ⚙️ GitHub Actions
- **`.github/workflows/deploy.yml`** - CI/CD pipeline for auto-deployment

### 📚 Documentation
- **`docs/VPS_DEPLOYMENT_GUIDE.md`** - Comprehensive deployment guide
- **`DEPLOYMENT_QUICK_REFERENCE.md`** - Quick commands reference

---

## 🚀 Quick Start Guide

### 1. Initial VPS Setup

Upload and run the VPS setup script:
```bash
scp scripts/setup-vps.sh user@your-vps:/tmp/
ssh user@your-vps "chmod +x /tmp/setup-vps.sh && sudo /tmp/setup-vps.sh"
```

### 2. Configure GitHub Secrets

Add these secrets in GitHub **Settings → Secrets and Variables → Actions**:
- `VPS_SSH_KEY` - SSH private key
- `VPS_HOST` - VPS IP or domain
- `VPS_USER` - SSH username
- `DEPLOY_PATH` - `/var/www/sendroli-factory`

### 3. Setup Environment Files

```bash
# On your VPS
cd /var/www/sendroli-factory
git clone https://github.com/yourusername/sendroli-group.git .

# Configure environments
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
cp mongodb/.env.example mongodb/.env

# Edit with your actual values
nano backend/.env.production
nano frontend/.env.production
nano mongodb/.env
```

### 4. Deploy

**Manual Deployment:**
```bash
./scripts/deploy.sh
```

**Automatic Deployment:**
- Push to `main` branch
- GitHub Actions will deploy automatically

---

## 🔧 Environment Variables Reference

### Essential Backend Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/sendroli_factory
JWT_SECRET=your_32_char_secret
CORS_ORIGIN=https://your-domain.com
```

### Essential Frontend Variables  
```env
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=Sendroli Factory Management
```

### Essential MongoDB Variables
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure_password
MONGO_INITDB_DATABASE=sendroli_factory
```

---

## 📊 Deployment Architecture

```
GitHub Repository
       ↓
   GitHub Actions
       ↓
   Tests & Build
       ↓
   Deploy to VPS
       ↓
┌─────────────────┐
│   VPS Server    │
│                 │
│ ┌─────────────┐ │
│ │   Nginx     │ │ ← Reverse Proxy & SSL
│ └─────────────┘ │
│        ↓        │
│ ┌─────────────┐ │
│ │  Frontend   │ │ ← React App (Port 80/443)
│ └─────────────┘ │
│        ↓        │
│ ┌─────────────┐ │
│ │   Backend   │ │ ← Node.js API (Port 5000)
│ └─────────────┘ │
│        ↓        │
│ ┌─────────────┐ │
│ │  MongoDB    │ │ ← Database (Port 27017)
│ └─────────────┘ │
└─────────────────┘
```

---

## 🛠️ Available Commands

### Deployment Scripts
| Script | Purpose |
|--------|---------|
| `./scripts/setup-vps.sh` | Initial VPS setup |
| `./scripts/deploy.sh` | Full deployment |
| `./scripts/quick-deploy.sh` | Fast deployment |
| `./scripts/rollback.sh` | Rollback deployment |

### Docker Commands
| Command | Purpose |
|---------|---------|
| `docker-compose -f docker-compose.prod.yml ps` | View services |
| `docker-compose -f docker-compose.prod.yml logs -f` | View logs |
| `docker-compose -f docker-compose.prod.yml restart` | Restart all |
| `docker-compose -f docker-compose.prod.yml down` | Stop all |

### Management Commands
| Command | Purpose |
|---------|---------|
| `curl http://localhost:5000/api/health` | Health check |
| `/usr/local/bin/server-health.sh` | System status |
| `sudo certbot certificates` | SSL status |
| `sudo fail2ban-client status` | Security status |

---

## 🔒 Security Features

### Implemented Security
- **Firewall Configuration** - UFW with specific port access
- **Fail2ban Protection** - Automatic IP blocking for suspicious activity
- **SSL/TLS Support** - HTTPS encryption with Let's Encrypt
- **Container Security** - Non-root users in Docker containers
- **Environment Isolation** - Separate production environment files
- **Automated Updates** - Security patches via unattended-upgrades

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content-Security-Policy configured

---

## 📈 Monitoring & Logging

### Log Locations
- **Application Logs:** `/var/log/sendroli-factory/`
- **Nginx Logs:** `/var/log/nginx/`
- **Docker Logs:** `docker-compose logs`
- **System Logs:** `/var/log/syslog`

### Monitoring Tools
- **htop** - Real-time process monitoring
- **docker stats** - Container resource usage
- **server-health.sh** - Custom health check script
- **logrotate** - Automatic log rotation

---

## 🚨 Troubleshooting

### Common Issues

**Services not starting:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Database connection issues:**
```bash
docker exec sendroli-mongodb mongo --eval "db.adminCommand('ismaster')"
```

**GitHub Actions failing:**
1. Check SSH key configuration
2. Verify GitHub Secrets
3. Test manual SSH connection
4. Check VPS resources

### Emergency Recovery
```bash
# Complete reset
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
docker system prune -f
./scripts/deploy.sh

# Rollback
./scripts/rollback.sh
```

---

## 🎯 Next Steps After Setup

1. **Test Deployment** - Verify all services are running
2. **Setup SSL** - Configure HTTPS with Let's Encrypt  
3. **Configure Monitoring** - Set up additional monitoring tools
4. **Backup Strategy** - Schedule regular database backups
5. **Performance Tuning** - Optimize for your specific needs

---

## 📞 Support

For questions about deployment:
1. Check the comprehensive guide: `docs/VPS_DEPLOYMENT_GUIDE.md`
2. Review quick reference: `DEPLOYMENT_QUICK_REFERENCE.md`
3. Check GitHub Actions logs for CI/CD issues
4. Create an issue in the repository

**Happy Deploying! 🚀**