#!/bin/bash

###############################################################################
# Transfer Project to Ubuntu Server
# This script helps you transfer the complete project to your server
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Transfer to Ubuntu Server                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Get server details
read -p "Enter your server IP address: " SERVER_IP
read -p "Enter SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

read -p "Do you want to use SSH key or password? (key/password): " AUTH_METHOD

if [ "$AUTH_METHOD" = "key" ]; then
    read -p "Enter path to your SSH key (default: ~/.ssh/id_rsa): " SSH_KEY
    SSH_KEY=${SSH_KEY:-~/.ssh/id_rsa}
    SSH_OPTS="-i $SSH_KEY"
else
    SSH_OPTS=""
fi

print_info "Testing SSH connection..."
if ssh $SSH_OPTS $SSH_USER@$SERVER_IP "echo 'Connection successful'" &>/dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to server. Please check your credentials."
    exit 1
fi

# Clean up Vercel files first
print_info "Cleaning up Vercel files..."
./cleanup-vercel.sh

# Exclude unnecessary files
print_info "Preparing files for transfer (excluding node_modules, etc.)..."

# Create temporary tar file
TAR_FILE="/tmp/sendroli-deploy-$(date +%s).tar.gz"

tar -czf "$TAR_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='uploads' \
    --exclude='backend/uploads' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.vercel' \
    --exclude='*.backup' \
    -C /Users/root1 Sendroli_Group

print_success "Files packaged"

# Transfer to server
print_info "Transferring files to server (this may take a few minutes)..."
scp $SSH_OPTS "$TAR_FILE" $SSH_USER@$SERVER_IP:/tmp/

print_success "Files transferred"

# Extract on server
print_info "Setting up on server..."
ssh $SSH_OPTS $SSH_USER@$SERVER_IP <<'ENDSSH'
    # Extract files
    cd /opt
    if [ -d "Sendroli_Group" ]; then
        echo "Backing up existing installation..."
        mv Sendroli_Group Sendroli_Group.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    tar -xzf /tmp/sendroli-deploy-*.tar.gz
    rm /tmp/sendroli-deploy-*.tar.gz
    
    # Set permissions
    chmod +x /opt/Sendroli_Group/deploy-to-ubuntu.sh
    chmod +x /opt/Sendroli_Group/cleanup-vercel.sh
    
    echo "Files extracted to /opt/Sendroli_Group"
ENDSSH

print_success "Setup complete on server"

# Clean up local tar file
rm "$TAR_FILE"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Transfer Complete!                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. SSH into your server:"
echo -e "     ${YELLOW}ssh $SSH_USER@$SERVER_IP${NC}"
echo -e ""
echo -e "  2. Run the deployment script:"
echo -e "     ${YELLOW}cd /opt/Sendroli_Group${NC}"
echo -e "     ${YELLOW}./deploy-to-ubuntu.sh${NC}"
echo -e ""
echo -e "  3. Access your application:"
echo -e "     ${YELLOW}http://$SERVER_IP${NC}"
echo -e ""

read -p "Do you want to SSH into the server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh $SSH_OPTS $SSH_USER@$SERVER_IP
fi
