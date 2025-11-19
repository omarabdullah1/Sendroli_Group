#!/bin/bash

# VPS Initial Setup Script for Sendroli Factory Management
# Run this script on your VPS to prepare it for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🚀 Setting up VPS for Sendroli Factory Management${NC}"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw

# Install Docker
print_status "Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose >/dev/null 2>&1; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Install Node.js (for any local operations if needed)
print_status "Installing Node.js..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_status "Node.js installed successfully"
else
    print_warning "Node.js is already installed"
fi

# Install Nginx (for reverse proxy)
print_status "Installing Nginx..."
if ! command -v nginx >/dev/null 2>&1; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    print_status "Nginx installed successfully"
else
    print_warning "Nginx is already installed"
fi

# Configure firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Backend API
sudo ufw --force enable
print_status "Firewall configured"

# Create deployment directory
DEPLOY_PATH="/var/www/sendroli-factory"
print_status "Creating deployment directory..."
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

# Create backup directory
print_status "Creating backup directory..."
sudo mkdir -p /var/backups/sendroli-factory
sudo chown -R $USER:$USER /var/backups/sendroli-factory

# Create logs directory
print_status "Creating logs directory..."
sudo mkdir -p /var/log/sendroli-factory
sudo chown -R $USER:$USER /var/log/sendroli-factory

# Setup logrotate for application logs
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/sendroli-factory > /dev/null <<EOF
/var/log/sendroli-factory/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $DEPLOY_PATH/docker-compose.prod.yml restart backend || true
    endscript
}
EOF

# Install fail2ban for security
print_status "Installing fail2ban..."
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Configure basic fail2ban
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl restart fail2ban

# Setup automatic security updates
print_status "Setting up automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create a basic nginx configuration
print_status "Creating basic Nginx configuration..."
sudo tee /etc/nginx/sites-available/sendroli-factory > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/sendroli-factory /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup monitoring (basic)
print_status "Setting up basic monitoring..."
sudo apt install -y htop iotop nethogs

# Install and configure logwatch
sudo apt install -y logwatch
sudo mkdir -p /var/cache/logwatch

# Create a simple monitoring script
sudo tee /usr/local/bin/server-health.sh > /dev/null <<'EOF'
#!/bin/bash

# Simple server health check script
echo "=== Server Health Check - $(date) ==="
echo

echo "=== System Information ==="
uptime
echo

echo "=== Memory Usage ==="
free -h
echo

echo "=== Disk Usage ==="
df -h
echo

echo "=== Docker Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l
echo

echo "=== Application Logs (Last 10 lines) ==="
if [ -f "/var/log/sendroli-factory/production.log" ]; then
    tail -10 /var/log/sendroli-factory/production.log
else
    echo "No application logs found"
fi
EOF

sudo chmod +x /usr/local/bin/server-health.sh

# Create deployment user (if needed)
if ! id "deploy" &>/dev/null; then
    print_status "Creating deploy user..."
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
    sudo usermod -aG sudo deploy
    print_warning "Please set password for deploy user: sudo passwd deploy"
fi

# Display summary
echo
echo -e "${BLUE}🎉 VPS Setup Complete!${NC}"
echo "=================================="
echo "✅ Docker installed"
echo "✅ Docker Compose installed"
echo "✅ Node.js installed"
echo "✅ Nginx installed and configured"
echo "✅ Firewall configured"
echo "✅ Deployment directory created: $DEPLOY_PATH"
echo "✅ Backup directory created: /var/backups/sendroli-factory"
echo "✅ Log rotation configured"
echo "✅ Fail2ban security configured"
echo "✅ Basic monitoring tools installed"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add your SSH public key for GitHub Actions:"
echo "   - Generate SSH key: ssh-keygen -t rsa -b 4096 -C 'github-actions'"
echo "   - Add public key to ~/.ssh/authorized_keys"
echo "   - Add private key to GitHub Secrets as VPS_SSH_KEY"
echo
echo "2. Update GitHub Secrets with:"
echo "   - VPS_HOST: your-server-ip-or-domain"
echo "   - VPS_USER: $USER"
echo "   - DEPLOY_PATH: $DEPLOY_PATH"
echo
echo "3. Update Nginx configuration:"
echo "   - Edit /etc/nginx/sites-available/sendroli-factory"
echo "   - Replace 'your-domain.com' with your actual domain"
echo "   - Setup SSL with Let's Encrypt (recommended)"
echo
echo "4. Test the deployment:"
echo "   - Clone your repository to $DEPLOY_PATH"
echo "   - Create production environment files"
echo "   - Run the deployment script"
echo
echo "5. Optional: Setup SSL with certbot"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
echo
print_warning "Please reboot the server to ensure all changes take effect!"
print_warning "After reboot, you may need to re-login to use Docker without sudo."