#!/bin/bash

###############################################################################
# Sendroli Factory Management System - Ubuntu Server Deployment Script
# This script automates the deployment process on your Ubuntu server
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# Check if running as root or with sudo
check_root() {
    if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
        print_error "Please run as root or ensure your user is in the docker group"
        print_info "To add your user to docker group: sudo usermod -aG docker \$USER"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check Ubuntu version
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        print_info "OS: $NAME $VERSION"
    fi
    
    # Check available memory
    total_mem=$(free -m | awk 'NR==2{print $2}')
    if [ "$total_mem" -lt 2000 ]; then
        print_warning "Less than 2GB RAM detected. Recommended: 2GB or more"
    else
        print_success "Memory: ${total_mem}MB"
    fi
    
    # Check disk space
    available_space=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 20 ]; then
        print_warning "Less than 20GB disk space available"
    else
        print_success "Disk space: ${available_space}GB available"
    fi
}

# Install Docker
install_docker() {
    print_header "Installing Docker"
    
    if command -v docker &> /dev/null; then
        print_success "Docker already installed: $(docker --version)"
        return 0
    fi
    
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    if [ "$EUID" -ne 0 ]; then
        sudo usermod -aG docker $USER
        print_warning "You've been added to docker group. Please logout and login again, then re-run this script"
        exit 0
    fi
    
    print_success "Docker installed successfully"
}

# Install Git
install_git() {
    print_header "Installing Git"
    
    if command -v git &> /dev/null; then
        print_success "Git already installed: $(git --version)"
        return 0
    fi
    
    print_info "Installing Git..."
    sudo apt update
    sudo apt install -y git
    
    print_success "Git installed successfully"
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"
    
    if ! command -v ufw &> /dev/null; then
        print_info "UFW not installed, skipping firewall configuration"
        return 0
    fi
    
    print_info "Configuring firewall rules..."
    
    # Check if UFW is active
    if sudo ufw status | grep -q "Status: active"; then
        print_info "Firewall is already active"
    else
        # Allow SSH first to prevent lockout
        sudo ufw allow OpenSSH
        sudo ufw --force enable
    fi
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 5000/tcp
    
    print_success "Firewall configured"
    sudo ufw status
}

# Clone or update repository
setup_repository() {
    print_header "Setting Up Repository"
    
    REPO_URL="https://github.com/omarabdullah1/Sendroli_Group.git"
    INSTALL_DIR="/opt/Sendroli_Group"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_info "Repository already exists. Updating..."
        cd "$INSTALL_DIR"
        git pull origin main
        print_success "Repository updated"
    else
        print_info "Cloning repository..."
        sudo git clone "$REPO_URL" "$INSTALL_DIR"
        print_success "Repository cloned"
    fi
    
    # Set permissions
    if [ "$EUID" -eq 0 ]; then
        chown -R $SUDO_USER:$SUDO_USER "$INSTALL_DIR"
    fi
}

# Create environment files
create_env_files() {
    print_header "Creating Environment Files"
    
    INSTALL_DIR="/opt/Sendroli_Group"
    cd "$INSTALL_DIR"
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    print_info "Detected server IP: $SERVER_IP"
    
    # Prompt for custom values or use defaults
    read -p "Enter your domain name (or press Enter to use IP address): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        DOMAIN_NAME="http://$SERVER_IP"
    else
        DOMAIN_NAME="https://$DOMAIN_NAME"
    fi
    
    read -sp "Enter MongoDB password (or press Enter for auto-generated): " MONGO_PASSWORD
    echo
    if [ -z "$MONGO_PASSWORD" ]; then
        MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    fi
    
    read -sp "Enter JWT secret (or press Enter for auto-generated): " JWT_SECRET
    echo
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    fi
    
    # Create backend .env.production
    print_info "Creating backend environment file..."
    cat > "$INSTALL_DIR/backend/.env.production" <<EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/factory_management?authSource=admin

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=${DOMAIN_NAME}

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
EOF
    print_success "Backend environment file created"
    
    # Create frontend .env.production
    print_info "Creating frontend environment file..."
    cat > "$INSTALL_DIR/frontend/.env.production" <<EOF
# API Configuration
VITE_API_URL=${DOMAIN_NAME}/api

# App Configuration
VITE_APP_NAME=Sendroli Factory Management
EOF
    print_success "Frontend environment file created"
    
    # Create MongoDB .env
    print_info "Creating MongoDB environment file..."
    mkdir -p "$INSTALL_DIR/mongodb"
    cat > "$INSTALL_DIR/mongodb/.env" <<EOF
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_INITDB_DATABASE=factory_management
EOF
    print_success "MongoDB environment file created"
    
    # Save credentials to a file
    print_info "Saving credentials..."
    cat > "$INSTALL_DIR/CREDENTIALS.txt" <<EOF
===========================================
Sendroli Factory Management System
Deployment Credentials
===========================================

SERVER INFORMATION:
-------------------
Server IP: $SERVER_IP
Domain: ${DOMAIN_NAME}
Frontend URL: ${DOMAIN_NAME}
Backend API: ${DOMAIN_NAME}/api

DATABASE CREDENTIALS:
---------------------
MongoDB Username: admin
MongoDB Password: ${MONGO_PASSWORD}
Database Name: factory_management

SECURITY:
---------
JWT Secret: ${JWT_SECRET}

DEFAULT APPLICATION USERS:
--------------------------
Admin:
  Username: admin
  Password: admin123 (CHANGE IMMEDIATELY!)

Receptionist:
  Username: receptionist
  Password: recep123

Designer:
  Username: designer
  Password: design123

Worker:
  Username: worker
  Password: worker123

Financial:
  Username: financial
  Password: finance123

⚠️ IMPORTANT SECURITY NOTES:
-----------------------------
1. Change all default passwords immediately after first login
2. Keep this file secure and delete it after noting the credentials
3. Never commit this file to version control
4. Store passwords in a secure password manager

Generated on: $(date)
===========================================
EOF
    
    chmod 600 "$INSTALL_DIR/CREDENTIALS.txt"
    print_success "Credentials saved to $INSTALL_DIR/CREDENTIALS.txt"
    print_warning "⚠️  Please save your credentials from CREDENTIALS.txt and delete it!"
}

# Update docker-compose.prod.yml to remove Vercel references
clean_docker_compose() {
    print_header "Cleaning Docker Compose Configuration"
    
    INSTALL_DIR="/opt/Sendroli_Group"
    cd "$INSTALL_DIR"
    
    # Backup original
    if [ ! -f "docker-compose.prod.yml.backup" ]; then
        cp docker-compose.prod.yml docker-compose.prod.yml.backup
        print_info "Backed up original docker-compose.prod.yml"
    fi
    
    print_success "Docker compose configuration ready"
}

# Build and deploy
deploy_application() {
    print_header "Building and Deploying Application"
    
    INSTALL_DIR="/opt/Sendroli_Group"
    cd "$INSTALL_DIR"
    
    print_info "Building Docker images (this may take several minutes)..."
    docker compose -f docker-compose.prod.yml build
    
    print_success "Docker images built successfully"
    
    print_info "Starting services..."
    docker compose -f docker-compose.prod.yml up -d
    
    print_success "Services started"
    
    # Wait for services to be ready
    print_info "Waiting for services to initialize..."
    sleep 10
    
    # Check service health
    print_info "Checking service health..."
    docker compose -f docker-compose.prod.yml ps
}

# Seed database
seed_database() {
    print_header "Seeding Database"
    
    read -p "Do you want to seed the database with default users? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Seeding database..."
        docker exec sendroli-backend npm run seed || print_warning "Seed script not available or already seeded"
        print_success "Database seeded (if seed script exists)"
    else
        print_info "Skipping database seeding"
    fi
}

# Display deployment info
show_deployment_info() {
    print_header "Deployment Complete!"
    
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}✓ Your Sendroli Factory Management System is now deployed!${NC}\n"
    
    echo -e "${BLUE}Access Information:${NC}"
    echo -e "  Frontend: ${GREEN}http://$SERVER_IP${NC}"
    echo -e "  Backend API: ${GREEN}http://$SERVER_IP:5000/api${NC}"
    echo -e "  API Health: ${GREEN}http://$SERVER_IP:5000/api/health${NC}"
    
    echo -e "\n${BLUE}Default Admin Credentials:${NC}"
    echo -e "  Username: ${YELLOW}admin${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo -e "  ${RED}⚠️  CHANGE THIS PASSWORD IMMEDIATELY!${NC}"
    
    echo -e "\n${BLUE}All credentials saved in:${NC}"
    echo -e "  ${YELLOW}/opt/Sendroli_Group/CREDENTIALS.txt${NC}"
    
    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo -e "  View logs: ${YELLOW}cd /opt/Sendroli_Group && docker compose -f docker-compose.prod.yml logs -f${NC}"
    echo -e "  Stop services: ${YELLOW}cd /opt/Sendroli_Group && docker compose -f docker-compose.prod.yml down${NC}"
    echo -e "  Restart services: ${YELLOW}cd /opt/Sendroli_Group && docker compose -f docker-compose.prod.yml restart${NC}"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "  1. Access your application at http://$SERVER_IP"
    echo -e "  2. Login with admin credentials"
    echo -e "  3. Change all default passwords"
    echo -e "  4. Configure your domain and SSL (see UBUNTU_SERVER_DEPLOYMENT.md)"
    echo -e "  5. Set up regular database backups"
    
    echo -e "\n${BLUE}Documentation:${NC}"
    echo -e "  Full guide: ${YELLOW}/opt/Sendroli_Group/UBUNTU_SERVER_DEPLOYMENT.md${NC}"
    
    echo -e "\n${GREEN}Thank you for using Sendroli Factory Management System!${NC}\n"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    clear
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║  Sendroli Factory Management System                   ║"
    echo "║  Ubuntu Server Deployment Script                      ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    print_warning "This script will install and configure the complete system on your Ubuntu server"
    read -p "Do you want to continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    check_root
    check_requirements
    install_docker
    install_git
    configure_firewall
    setup_repository
    create_env_files
    clean_docker_compose
    deploy_application
    seed_database
    show_deployment_info
}

# Run main function
main
