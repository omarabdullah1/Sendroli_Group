# 🚀 Quick Deployment Reference

## Manual VPS Deployment Commands

### Initial VPS Setup
```bash
# 1. Upload and run setup script
scp scripts/setup-vps.sh user@your-vps:/tmp/
ssh user@your-vps "chmod +x /tmp/setup-vps.sh && sudo /tmp/setup-vps.sh"

# 2. Clone your repository
ssh user@your-vps
cd /var/www/sendroli-factory
git clone https://github.com/yourusername/sendroli-group.git .
```

### Configure Environment Files
```bash
# Backend environment
cp backend/.env.production.example backend/.env.production
nano backend/.env.production  # Edit with your values

# Frontend environment  
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production  # Edit with your values

# MongoDB environment
mkdir -p mongodb
cp mongodb/.env.example mongodb/.env
nano mongodb/.env  # Edit with your values
```

### Deploy Application
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run full deployment
./scripts/deploy.sh

# Or quick deployment (for testing)
./scripts/quick-deploy.sh
```

### Verify Deployment
```bash
# Check services
docker-compose -f docker-compose.prod.yml ps

# Test backend
curl http://localhost:5000/api/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## GitHub Actions Auto-Deployment

### Required GitHub Secrets
Set these in **Settings → Secrets and Variables → Actions**:

- `VPS_SSH_KEY` - SSH private key for deployment
- `VPS_HOST` - Your VPS IP address or domain
- `VPS_USER` - SSH username (e.g., root, ubuntu)
- `DEPLOY_PATH` - `/var/www/sendroli-factory`
- `SLACK_WEBHOOK` - (Optional) Slack webhook for notifications

### SSH Key Setup
```bash
# On your VPS, generate deployment keys
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions

# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key content to GitHub Secrets as VPS_SSH_KEY
cat ~/.ssh/github_actions
```

### Auto-Deploy Process
1. Push to `main` branch
2. Tests run automatically
3. If tests pass, deployment starts
4. Application updates on VPS
5. Health checks verify deployment

---

## Essential Production Environment Variables

### Backend (.env.production)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/sendroli_factory
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-domain.com
BCRYPT_SALT_ROUNDS=12
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=Sendroli Factory Management
```

### MongoDB (.env)
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_mongodb_password
MONGO_INITDB_DATABASE=sendroli_factory
```

---

## Common Commands

### Deployment
```bash
./scripts/deploy.sh          # Full deployment
./scripts/quick-deploy.sh     # Quick deployment  
./scripts/rollback.sh         # Rollback to previous version
```

### Docker Management
```bash
# View services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Monitoring
```bash
# Health check
curl http://localhost:5000/api/health

# System health
/usr/local/bin/server-health.sh

# Resource usage
htop
df -h
docker stats
```

---

## Troubleshooting Quick Fixes

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check environment files exist
ls -la backend/.env.production frontend/.env.production mongodb/.env

# Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Issues
```bash
# Check MongoDB container
docker exec sendroli-mongodb mongo --eval "db.adminCommand('ismaster')"

# View MongoDB logs
docker logs sendroli-mongodb
```

### GitHub Actions Failing
1. Check SSH connection: `ssh user@vps-ip`
2. Verify GitHub Secrets are set correctly
3. Check Actions tab for error details
4. Ensure VPS has sufficient resources

---

## SSL Setup (Optional but Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## Emergency Recovery

### Complete Reset
```bash
# Stop everything
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans

# Clean Docker
docker system prune -f

# Redeploy
./scripts/deploy.sh
```

### Rollback
```bash
# Interactive rollback
./scripts/rollback.sh

# Or manually restore from backup
cp -r sendroli-factory-backup-YYYYMMDD-HHMMSS sendroli-factory
cd sendroli-factory
docker-compose -f docker-compose.prod.yml up -d
```