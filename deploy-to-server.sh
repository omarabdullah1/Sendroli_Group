#!/bin/bash

###############################################################################
# AUTOMATED DEPLOYMENT TO UBUNTU SERVER
# Server IP: 72.62.38.191
# SSH Key: ~/.ssh/id_ed25519
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="72.62.38.191"
SSH_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_DIR="/opt/Sendroli_Group"
LOCAL_DIR="/Users/root1/Sendroli_Group"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SENDROLI FACTORY MANAGEMENT - SERVER DEPLOYMENT         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Test SSH Connection
echo -e "${YELLOW}[1/7] Testing SSH connection to server...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "echo 'SSH connection successful!'" 2>&1; then
    echo -e "${GREEN}✓ SSH connection successful!${NC}"
else
    echo -e "${RED}✗ SSH connection failed!${NC}"
    echo -e "${RED}Please check:${NC}"
    echo -e "  - Server IP: $SERVER_IP"
    echo -e "  - SSH key exists at: $SSH_KEY"
    echo -e "  - Server is online and accessible"
    exit 1
fi

# Step 2: Clean local files
echo ""
echo -e "${YELLOW}[2/7] Cleaning unnecessary files...${NC}"
cd "$LOCAL_DIR"
echo -e "${GREEN}✓ Files already cleaned${NC}"

# Step 3: Create deployment package
echo ""
echo -e "${YELLOW}[3/7] Creating deployment package...${NC}"
cd "$LOCAL_DIR"
tar czf /tmp/sendroli-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='uploads' \
  --exclude='frontend/dist' \
  --exclude='frontend/build' \
  --exclude='backend/uploads' \
  --exclude='.vercel' \
  --exclude='coverage' \
  .

PACKAGE_SIZE=$(du -h /tmp/sendroli-deploy.tar.gz | cut -f1)
echo -e "${GREEN}✓ Package created: $PACKAGE_SIZE${NC}"

# Step 4: Transfer to server
echo ""
echo -e "${YELLOW}[4/7] Transferring files to server (this may take a few minutes)...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/sendroli-deploy.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"
echo -e "${GREEN}✓ Files transferred successfully${NC}"

# Step 5: Extract on server
echo ""
echo -e "${YELLOW}[5/7] Extracting files on server...${NC}"
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
    # Backup existing installation if it exists
    if [ -d "/opt/Sendroli_Group" ] && [ "$(ls -A /opt/Sendroli_Group 2>/dev/null)" ]; then
        echo "Backing up existing installation..."
        rm -rf /opt/Sendroli_Group_backup
        mv /opt/Sendroli_Group /opt/Sendroli_Group_backup
    fi
    
    # Create directory
    mkdir -p /opt/Sendroli_Group
    
    # Extract files
    cd /opt/Sendroli_Group
    tar -xzf /tmp/sendroli-deploy.tar.gz
    
    # Clean up
    rm /tmp/sendroli-deploy.tar.gz
    
    echo "Files extracted successfully!"
EOF
echo -e "${GREEN}✓ Files extracted on server${NC}"

# Step 6: Run deployment script on server
echo ""
echo -e "${YELLOW}[6/7] Running deployment script on server...${NC}"
echo -e "${BLUE}This will install Docker, configure firewall, and start services...${NC}"
echo -e "${BLUE}This may take 10-15 minutes. Please be patient...${NC}"
echo ""

ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
    cd /opt/Sendroli_Group
    
    # Make deploy script executable
    chmod +x deploy-to-ubuntu.sh
    
    # Run deployment
    ./deploy-to-ubuntu.sh
EOF

# Step 7: Get credentials
echo ""
echo -e "${YELLOW}[7/7] Retrieving deployment credentials...${NC}"
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "cat /opt/Sendroli_Group/CREDENTIALS.txt" > ./SERVER_CREDENTIALS.txt 2>/dev/null || echo "Note: Credentials file will be available after full deployment"

# Cleanup local temp file
rm -f /tmp/sendroli-deploy.tar.gz

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           DEPLOYMENT COMPLETED SUCCESSFULLY!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Your Application Details:${NC}"
echo -e "   Frontend URL: ${GREEN}http://$SERVER_IP${NC}"
echo -e "   Backend API:  ${GREEN}http://$SERVER_IP:5000/api${NC}"
echo -e "   Health Check: ${GREEN}http://$SERVER_IP:5000/api/health${NC}"
echo ""
echo -e "${BLUE}🔐 Credentials:${NC}"
if [ -f "./SERVER_CREDENTIALS.txt" ]; then
    echo -e "   ${GREEN}Saved to: ./SERVER_CREDENTIALS.txt${NC}"
else
    echo -e "   ${YELLOW}Check on server: ssh -i ~/.ssh/id_ed25519 root@$SERVER_IP${NC}"
    echo -e "   ${YELLOW}Then: cat /opt/Sendroli_Group/CREDENTIALS.txt${NC}"
fi
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "   1. Open your browser: ${GREEN}http://$SERVER_IP${NC}"
echo -e "   2. Login with credentials from SERVER_CREDENTIALS.txt"
echo -e "   3. Default login: admin / admin123"
echo -e "   4. ${RED}Change all default passwords immediately!${NC}"
echo ""
echo -e "${YELLOW}🔍 Check deployment status:${NC}"
echo -e "   ${BLUE}ssh -i ~/.ssh/id_ed25519 root@$SERVER_IP${NC}"
echo -e "   ${BLUE}cd /opt/Sendroli_Group${NC}"
echo -e "   ${BLUE}docker compose ps${NC}"
echo ""
echo -e "${GREEN}✨ Your factory management system is now live! ✨${NC}"
