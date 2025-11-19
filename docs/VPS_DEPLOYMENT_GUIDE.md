# 🚀 VPS Deployment Guide for Sendroli Factory Management

This comprehensive guide will help you deploy the Sendroli Factory Management System to your VPS and set up automatic deployments with GitHub Actions.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [VPS Initial Setup](#vps-initial-setup)
- [Manual Deployment](#manual-deployment)
- [GitHub Actions Setup](#github-actions-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Commands](#deployment-commands)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### VPS Requirements
- **OS:** Ubuntu 20.04+ or similar Linux distribution
- **RAM:** Minimum 2GB, recommended 4GB+
- **Storage:** Minimum 20GB SSD
- **CPU:** Minimum 1 vCPU, recommended 2+ vCPUs
- **Network:** Public IP address and domain name (optional but recommended)

### Local Requirements
- Git installed
- SSH access to your VPS
- GitHub account with repository access

### VPS Access
Make sure you can SSH into your VPS:
```bash
ssh your-username@your-server-ip
```

---

## 🛠️ VPS Initial Setup

### Step 1: Run the VPS Setup Script

Copy the setup script to your VPS and run it:

```bash
# On your VPS
wget https://raw.githubusercontent.com/yourusername/sendroli-group/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

Or manually copy the script from `scripts/setup-vps.sh` to your VPS.

### Step 2: Configure SSH for GitHub Actions

Generate SSH keys for GitHub Actions:

```bash
# On your VPS
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions
```

Add the public key to authorized keys:
```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

Copy the private key content:
```bash
cat ~/.ssh/github_actions
```

### Step 3: Configure Domain (Optional but Recommended)

If you have a domain, point it to your VPS IP address:
- Create an A record pointing to your VPS IP
- Update the Nginx configuration in `/etc/nginx/sites-available/sendroli-factory`
- Replace `your-domain.com` with your actual domain

### Step 4: Setup SSL Certificate (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 📝 Environment Configuration

### Backend Environment Variables

Create `/var/www/sendroli-factory/backend/.env.production`:

```bash
# Copy from example and edit
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

**Required Variables:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/sendroli_factory
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-domain.com
BCRYPT_SALT_ROUNDS=12
```

### Frontend Environment Variables

Create `/var/www/sendroli-factory/frontend/.env.production`:

```bash
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

**Required Variables:**
```env
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=Sendroli Factory Management
```

### MongoDB Environment Variables

Create `/var/www/sendroli-factory/mongodb/.env`:

```bash
mkdir -p mongodb
cp mongodb/.env.example mongodb/.env
nano mongodb/.env
```

**Required Variables:**
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_mongodb_password
MONGO_INITDB_DATABASE=sendroli_factory
```

---

## 🚀 Manual Deployment

### Step 1: Clone Repository

```bash
# On your VPS
cd /var/www/sendroli-factory
git clone https://github.com/yourusername/sendroli-group.git .
```

### Step 2: Setup Environment Files

Create and configure your environment files as described in the [Environment Configuration](#environment-configuration) section.

### Step 3: Run Deployment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run full deployment
./scripts/deploy.sh
```

### Step 4: Verify Deployment

Check that services are running:
```bash
docker-compose -f docker-compose.prod.yml ps
```

Test the application:
```bash
# Backend health check
curl http://localhost:5000/api/health

# Frontend (if accessible directly)
curl http://localhost:80
```

---

## ⚙️ GitHub Actions Setup

### Step 1: Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and Variables → Actions** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_SSH_KEY` | Private key content | SSH private key for deployment |
| `VPS_HOST` | `your-server-ip` | Your VPS IP address or domain |
| `VPS_USER` | `your-username` | SSH username for your VPS |
| `DEPLOY_PATH` | `/var/www/sendroli-factory` | Deployment directory path |
| `SLACK_WEBHOOK` | `webhook-url` | (Optional) Slack notifications |

### Step 2: Test GitHub Actions

1. Make any change to your code
2. Commit and push to the `main` branch
3. Check the **Actions** tab in your GitHub repository
4. Monitor the deployment process

### Step 3: Verify Automatic Deployment

After the GitHub Action completes:
- SSH into your VPS
- Check that services are updated
- Verify the application is working

---

## 📊 Deployment Commands

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Full Deployment** | `./scripts/deploy.sh` | Complete deployment with all checks |
| **Quick Deployment** | `./scripts/quick-deploy.sh` | Fast deployment for testing |
| **Rollback** | `./scripts/rollback.sh` | Rollback to previous version |
| **VPS Setup** | `./scripts/setup-vps.sh` | Initial VPS configuration |

### Docker Commands

```bash
# View running services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Access backend container
docker exec -it sendroli-backend bash

# Access database
docker exec -it sendroli-mongodb mongo
```

### Useful Commands

```bash
# Check system resources
htop
df -h
free -h

# View nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check service status
sudo systemctl status nginx
sudo systemctl status docker

# View application logs
tail -f /var/log/sendroli-factory/production.log

# Run health check
/usr/local/bin/server-health.sh
```

---

## 📈 Monitoring and Maintenance

### Health Monitoring

1. **Application Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Service Status:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **System Resources:**
   ```bash
   /usr/local/bin/server-health.sh
   ```

### Backup Strategy

1. **Database Backup:**
   ```bash
   ./scripts/deploy.sh backup
   ```

2. **Application Backup:**
   ```bash
   # Backups are automatically created during deployments
   ls -la sendroli-factory-backup-*
   ```

3. **Restore from Backup:**
   ```bash
   ./scripts/rollback.sh
   ```

### Log Management

- **Application logs:** `/var/log/sendroli-factory/`
- **Nginx logs:** `/var/log/nginx/`
- **Docker logs:** `docker-compose logs`
- **System logs:** `/var/log/syslog`

### Security Maintenance

1. **Update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Update Docker images:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Review fail2ban logs:**
   ```bash
   sudo fail2ban-client status
   ```

4. **Check SSL certificate expiry:**
   ```bash
   sudo certbot certificates
   ```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Services Not Starting

**Check logs:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Common causes:**
- Environment variables not set
- Port conflicts
- Insufficient resources

#### 2. Database Connection Issues

**Check MongoDB status:**
```bash
docker exec sendroli-mongodb mongo --eval "db.adminCommand('ismaster')"
```

**Check connection string in environment file**

#### 3. GitHub Actions Failing

**Common causes:**
- SSH key not configured correctly
- Secrets not set in GitHub
- VPS not accessible

**Debug:**
- Check GitHub Actions logs
- Test SSH connection manually
- Verify all secrets are set

#### 4. SSL Certificate Issues

**Renew certificate:**
```bash
sudo certbot renew
```

**Test configuration:**
```bash
sudo nginx -t
```

#### 5. High Resource Usage

**Check resource usage:**
```bash
docker stats
htop
```

**Restart services:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Emergency Procedures

#### 1. Quick Restart
```bash
./scripts/quick-deploy.sh
```

#### 2. Rollback to Previous Version
```bash
./scripts/rollback.sh
```

#### 3. Emergency Stop
```bash
docker-compose -f docker-compose.prod.yml down
```

#### 4. Container Recovery
```bash
# Remove all containers and start fresh
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
docker system prune -f
./scripts/deploy.sh
```

---

## 📞 Support

### Getting Help

1. **Check Logs:** Always start by checking the logs
2. **Review Configuration:** Verify environment variables
3. **Test Manually:** Try running commands manually
4. **Check Resources:** Monitor system resources

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Documentation](https://docs.mongodb.com/)

### Contact Information

For support with the Sendroli Factory Management System:
- Create an issue in the GitHub repository
- Check the main project documentation
- Review the troubleshooting guides

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] VPS setup completed
- [ ] SSH keys configured
- [ ] Domain configured (if applicable)
- [ ] SSL certificate installed (if applicable)
- [ ] Environment files configured
- [ ] GitHub secrets configured

### During Deployment
- [ ] Code pulled successfully
- [ ] Docker images built without errors
- [ ] All containers started successfully
- [ ] Health checks passing
- [ ] Database accessible

### Post-Deployment
- [ ] Application accessible via browser
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] All user roles functioning
- [ ] Monitoring setup verified
- [ ] Backup strategy tested

**Happy Deploying! 🚀**