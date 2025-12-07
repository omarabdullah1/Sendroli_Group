# 🎯 Step-by-Step Deployment Checklist

## 📍 You Are Here: Preparing for Ubuntu Server Deployment

---

## Phase 1: Preparation (On Your Mac) ☑️

### Step 1.1: Clean Up Vercel Files
```bash
cd /Users/root1/Sendroli_Group
./cleanup-vercel.sh
```
**Expected Output**: ✓ Vercel files removed, backups created

**Status**: [ ] Done

---

### Step 1.2: Verify Project Structure
```bash
ls -la
```
**You Should See**:
- ✅ `cleanup-vercel.sh`
- ✅ `deploy-to-ubuntu.sh`
- ✅ `transfer-to-server.sh`
- ✅ `UBUNTU_SERVER_DEPLOYMENT.md`
- ✅ `backend/` directory
- ✅ `frontend/` directory
- ✅ `docker-compose.prod.yml`

**Status**: [ ] Done

---

## Phase 2: Transfer to Server (On Your Mac) ☑️

### Step 2.1: Run Transfer Script
```bash
./transfer-to-server.sh
```

**You Will Be Asked**:
1. Server IP address: `YOUR_SERVER_IP`
2. SSH username: `root` (or your username)
3. Authentication: `key` or `password`

**Expected Output**: ✓ Files transferred to /opt/Sendroli_Group

**Status**: [ ] Done

---

### Step 2.2: Verify Transfer (Alternative Manual Method)
If automated script fails, use manual transfer:
```bash
scp -r /Users/root1/Sendroli_Group root@YOUR_SERVER_IP:/opt/
```

**Status**: [ ] Done (if needed)

---

## Phase 3: Deploy on Server (On Ubuntu Server) ☑️

### Step 3.1: SSH into Server
```bash
ssh root@YOUR_SERVER_IP
```

**Expected**: You're now logged into your Ubuntu server

**Status**: [ ] Done

---

### Step 3.2: Navigate to Project
```bash
cd /opt/Sendroli_Group
ls -la
```

**You Should See**: All project files listed

**Status**: [ ] Done

---

### Step 3.3: Run Deployment Script
```bash
./deploy-to-ubuntu.sh
```

**The Script Will**:
- [ ] Check system requirements
- [ ] Install Docker (if needed)
- [ ] Install Git (if needed)
- [ ] Configure firewall
- [ ] Create environment files
- [ ] Generate secure passwords
- [ ] Build Docker images (~5-10 minutes)
- [ ] Start all services
- [ ] (Optional) Seed database

**Expected Duration**: 10-15 minutes

**Status**: [ ] Done

---

### Step 3.4: Verify Deployment
```bash
docker ps
```

**Expected Output**: You should see 3 running containers:
```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
xxxxxxxxxxxx   sendroli-frontend  Up X minutes   0.0.0.0:80->80/tcp      sendroli-frontend
xxxxxxxxxxxx   sendroli-backend   Up X minutes   0.0.0.0:5000->5000/tcp  sendroli-backend
xxxxxxxxxxxx   mongo:6.0          Up X minutes   27017/tcp               sendroli-mongodb
```

**Status**: [ ] All 3 containers running

---

### Step 3.5: Test Frontend
```bash
curl http://localhost:80
```

**Expected**: HTML response from React app

**Status**: [ ] Done

---

### Step 3.6: Test Backend API
```bash
curl http://localhost:5000/api/health
```

**Expected Output**:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "Connected"
}
```

**Status**: [ ] Done

---

## Phase 4: Access & Configuration ☑️

### Step 4.1: Get Your Credentials
```bash
cat /opt/Sendroli_Group/CREDENTIALS.txt
```

**Save These Values**:
- [ ] Server IP: ________________
- [ ] MongoDB Password: ________________
- [ ] JWT Secret: ________________

**Status**: [ ] Credentials saved securely

---

### Step 4.2: Access Frontend (On Your Browser)
```
Open: http://YOUR_SERVER_IP
```

**Expected**: You see the Sendroli Factory Management login page

**Status**: [ ] Login page loads

---

### Step 4.3: Test Login
```
Username: admin
Password: admin123
```

**Expected**: Successfully logged in to dashboard

**Status**: [ ] Logged in successfully

---

### Step 4.4: Change Admin Password
1. Click on user profile/settings
2. Change password from `admin123` to a secure password
3. Save changes

**Status**: [ ] Admin password changed

---

### Step 4.5: Change Other Default Passwords
Login with each account and change password:
- [ ] receptionist (recep123)
- [ ] designer (design123)
- [ ] worker (worker123)
- [ ] financial (finance123)

**Status**: [ ] All passwords changed

---

## Phase 5: Verification & Testing ☑️

### Step 5.1: Test Client Management
1. Login as admin
2. Navigate to Clients
3. Create a test client
4. Verify client appears in list

**Status**: [ ] Client management works

---

### Step 5.2: Test Order Management
1. Login as admin
2. Navigate to Orders
3. Create a test order
4. Verify order appears in list

**Status**: [ ] Order management works

---

### Step 5.3: Test Role-Based Access
1. Logout from admin
2. Login as designer
3. Verify you can see orders but not clients
4. Logout from designer
5. Login as receptionist
6. Verify you can see clients but not orders

**Status**: [ ] Role-based access works

---

### Step 5.4: Check Logs
```bash
cd /opt/Sendroli_Group
docker compose -f docker-compose.prod.yml logs -f
```

**Look For**:
- [ ] No error messages
- [ ] Backend started successfully
- [ ] MongoDB connected
- [ ] Frontend served

**Status**: [ ] No critical errors

---

## Phase 6: Optional Enhancements ☐

### Step 6.1: Setup Domain (Optional)
See `UBUNTU_SERVER_DEPLOYMENT.md` section: "Optional: Domain Setup with SSL"

**Status**: [ ] Domain configured (optional)

---

### Step 6.2: Install SSL Certificate (Optional)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com
```

**Status**: [ ] SSL installed (optional)

---

### Step 6.3: Setup Backup System (Recommended)
```bash
# Create backup directory
mkdir -p /opt/backups/mongodb

# Create backup script
nano /opt/backup-sendroli.sh
```

Add content from `UBUNTU_SERVER_DEPLOYMENT.md` backup section

**Status**: [ ] Backup system configured

---

### Step 6.4: Setup Monitoring (Optional)
Consider installing:
- [ ] Prometheus
- [ ] Grafana
- [ ] Netdata

**Status**: [ ] Monitoring configured (optional)

---

## 🎉 Final Checklist

### Deployment Status
- [ ] All Docker containers running
- [ ] Frontend accessible via browser (http://YOUR_SERVER_IP)
- [ ] Backend API responding (/api/health)
- [ ] Database connected and working
- [ ] Can login with admin account
- [ ] All default passwords changed
- [ ] Client management tested
- [ ] Order management tested
- [ ] Role-based access verified
- [ ] No critical errors in logs
- [ ] Credentials saved securely
- [ ] Firewall configured (ports 80, 443, 5000 open)
- [ ] (Optional) Domain configured
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) Backup system setup
- [ ] Documentation reviewed

---

## 📊 Quick Reference

### Your Deployment Info
```
Server IP: _____________________
Frontend URL: http://_____________________
Backend API: http://_____________________:5000/api
Admin Username: admin
Admin Password: _____________________ (changed from admin123)
```

### Essential Commands
```bash
# Navigate to project
cd /opt/Sendroli_Group

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker ps

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## 🆘 If Something Goes Wrong

### Container Not Running?
```bash
docker compose -f docker-compose.prod.yml logs [container-name]
docker compose -f docker-compose.prod.yml restart [container-name]
```

### Cannot Access Frontend?
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp

# Check container
docker logs sendroli-frontend
```

### Backend API Not Responding?
```bash
# Check logs
docker logs sendroli-backend

# Verify environment file
cat backend/.env.production

# Restart
docker compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues?
```bash
# Check MongoDB logs
docker logs sendroli-mongodb

# Verify it's running
docker ps | grep mongodb

# Check credentials in backend/.env.production
```

---

## 📞 Need Help?

1. **Check Logs First**: `docker compose -f docker-compose.prod.yml logs -f`
2. **Review Documentation**: `UBUNTU_SERVER_DEPLOYMENT.md`
3. **Verify All Checkboxes**: Complete this checklist top to bottom
4. **Check Troubleshooting Section**: See UBUNTU_SERVER_DEPLOYMENT.md

---

## ✅ Deployment Complete!

**Once all checkboxes are checked, your deployment is successful!**

🎊 **Congratulations!** Your Sendroli Factory Management System is now:
- ✅ Running on your own Ubuntu server
- ✅ Independent of Vercel or other platforms
- ✅ Fully containerized with Docker
- ✅ Production-ready and secure
- ✅ Easy to maintain and scale

**Access your system at**: `http://YOUR_SERVER_IP`

---

**Date Deployed**: _______________

**Deployed By**: _______________

**Server Details**: _______________

---

**Keep this checklist for future reference and maintenance!**
