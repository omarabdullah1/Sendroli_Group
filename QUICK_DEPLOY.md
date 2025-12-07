# 🚀 Quick Deployment Guide - Ubuntu Server

## One-Command Deployment

### From Your Local Machine:

```bash
# 1. Clean up Vercel files
chmod +x cleanup-vercel.sh
./cleanup-vercel.sh

# 2. Transfer to your server
scp -r /Users/root1/Sendroli_Group root@YOUR_SERVER_IP:/opt/

# 3. SSH into your server
ssh root@YOUR_SERVER_IP

# 4. Run deployment script
cd /opt/Sendroli_Group
chmod +x deploy-to-ubuntu.sh
./deploy-to-ubuntu.sh
```

That's it! The script will handle everything automatically.

---

## What the Script Does

1. ✅ Installs Docker and Docker Compose
2. ✅ Installs Git
3. ✅ Configures firewall (ports 80, 443, 5000)
4. ✅ Creates production environment files
5. ✅ Generates secure passwords
6. ✅ Builds Docker images
7. ✅ Starts all services (frontend, backend, database)
8. ✅ Seeds database with default users

---

## After Deployment

### Access Your Application
- **Frontend**: `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP:5000/api`

### Default Login
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **CHANGE PASSWORD IMMEDIATELY!**

### Check Credentials
```bash
cat /opt/Sendroli_Group/CREDENTIALS.txt
```

---

## Common Commands

```bash
# Navigate to project
cd /opt/Sendroli_Group

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend

# Check running containers
docker ps

# Check service status
docker compose -f docker-compose.prod.yml ps
```

---

## Need Help?

See full documentation: `UBUNTU_SERVER_DEPLOYMENT.md`

---

**🎉 Your factory management system is ready!**
