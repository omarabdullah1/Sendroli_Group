#!/bin/bash

##############################################################################
# SENDROLI FACTORY - SERVER CONSOLE SETUP SCRIPT
# Run this script directly in your VPS console to prepare for deployment
##############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SENDROLI FACTORY - SERVER CONSOLE SETUP                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

##############################################################################
# STEP 1: Add SSH Public Key
##############################################################################
print_step "Step 1: Adding SSH public key to authorized_keys..."

mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the SSH public key
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFWPgASx7ghg/w2xEL6o9naCcLKBKKUSUS5P8DTnabGy sendroli@deployment
EOF

chmod 600 ~/.ssh/authorized_keys
print_success "SSH public key added successfully"

##############################################################################
# STEP 2: Configure SSH Service
##############################################################################
print_step "Step 2: Configuring SSH service..."

# Ensure SSH is enabled and running
systemctl enable sshd 2>/dev/null || systemctl enable ssh 2>/dev/null || true
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true
systemctl status sshd 2>/dev/null || systemctl status ssh 2>/dev/null || true

print_success "SSH service configured"

##############################################################################
# STEP 3: Configure Firewall (UFW)
##############################################################################
print_step "Step 3: Configuring firewall..."

# Check if UFW is installed
if command -v ufw &> /dev/null; then
    # Allow SSH
    ufw allow 22/tcp >/dev/null 2>&1 || true
    
    # Allow HTTP
    ufw allow 80/tcp >/dev/null 2>&1 || true
    
    # Allow Backend API
    ufw allow 5000/tcp >/dev/null 2>&1 || true
    
    # Enable UFW if not already enabled
    echo "y" | ufw enable >/dev/null 2>&1 || true
    
    print_success "Firewall configured (SSH: 22, HTTP: 80, API: 5000)"
    ufw status
else
    print_warning "UFW not installed, skipping firewall configuration"
fi

##############################################################################
# STEP 4: Update System
##############################################################################
print_step "Step 4: Updating system packages..."

apt-get update -qq
print_success "System packages updated"

##############################################################################
# STEP 5: Install Required Packages
##############################################################################
print_step "Step 5: Installing required packages..."

# Install essential tools
apt-get install -y -qq curl wget git tar gzip >/dev/null 2>&1

print_success "Required packages installed"

##############################################################################
# STEP 6: Install Docker
##############################################################################
print_step "Step 6: Installing Docker..."

if ! command -v docker &> /dev/null; then
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc >/dev/null 2>&1 || true
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh >/dev/null 2>&1
    rm get-docker.sh
    
    # Start Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

docker --version

##############################################################################
# STEP 7: Install Docker Compose
##############################################################################
print_step "Step 7: Installing Docker Compose..."

if ! command -v docker-compose &> /dev/null; then
    # Install Docker Compose V2 (as Docker plugin)
    apt-get install -y docker-compose-plugin >/dev/null 2>&1 || {
        # Fallback to standalone installation
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
        curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    }
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

docker-compose --version || docker compose version

##############################################################################
# STEP 8: Create Deployment Directory
##############################################################################
print_step "Step 8: Creating deployment directory..."

mkdir -p /opt/Sendroli_Group
cd /opt/Sendroli_Group

print_success "Deployment directory created: /opt/Sendroli_Group"

##############################################################################
# STEP 9: Check Network Configuration
##############################################################################
print_step "Step 9: Checking network configuration..."

echo "Public IP Address:"
curl -s ifconfig.me || curl -s icanhazip.com || echo "Unable to detect"

echo ""
echo "Network Interfaces:"
ip addr show | grep -E "inet |UP" | head -10

print_success "Network configuration checked"

##############################################################################
# STEP 10: Summary
##############################################################################
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SERVER SETUP COMPLETED SUCCESSFULLY                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Server is now ready for deployment!"
echo ""
echo "✓ SSH key added and configured"
echo "✓ SSH service running"
echo "✓ Firewall configured (ports 22, 80, 5000)"
echo "✓ Docker and Docker Compose installed"
echo "✓ Deployment directory created: /opt/Sendroli_Group"
echo ""
echo "Next Steps:"
echo "1. Exit this console"
echo "2. Test SSH connection from your local machine:"
echo "   ssh root@72.62.38.191"
echo "3. Run the deployment script from your local machine"
echo ""
echo "═══════════════════════════════════════════════════════════════"
