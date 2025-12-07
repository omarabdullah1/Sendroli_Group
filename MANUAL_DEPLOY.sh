#!/bin/bash

###############################################################################
# Manual Deployment Instructions
# Use this if you want to deploy manually with your SSH key
###############################################################################

echo "🚀 SENDROLI DEPLOYMENT - MANUAL STEPS"
echo "======================================"
echo ""

# Variables you need to set
SERVER_IP="YOUR_SERVER_IP"  # Replace with your actual server IP
SSH_USER="root"             # Or your username
SSH_KEY="~/.ssh/id_ed25519" # Path to your SSH key

echo "📋 Step-by-Step Instructions:"
echo ""
echo "1️⃣  First, replace these variables in this script:"
echo "    SERVER_IP='your.server.ip.address'"
echo "    SSH_USER='root' (or your username)"
echo "    SSH_KEY='path/to/your/ssh/key'"
echo ""
echo "2️⃣  Test SSH connection:"
echo "    ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
echo ""
echo "3️⃣  Transfer project to server:"
echo "    # Create tar file excluding unnecessary files"
echo "    tar czf sendroli-deploy.tar.gz \\"
echo "      --exclude='node_modules' \\"
echo "      --exclude='.git' \\"
echo "      --exclude='*.log' \\"
echo "      --exclude='.DS_Store' \\"
echo "      --exclude='uploads' \\"
echo "      --exclude='dist' \\"
echo "      --exclude='build' \\"
echo "      --exclude='.vercel' \\"
echo "      ."
echo ""
echo "    # Transfer to server"
echo "    scp -i $SSH_KEY sendroli-deploy.tar.gz $SSH_USER@$SERVER_IP:/tmp/"
echo ""
echo "4️⃣  SSH into server and extract:"
echo "    ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
echo "    cd /opt"
echo "    sudo tar -xzf /tmp/sendroli-deploy.tar.gz"
echo "    sudo mv Sendroli_Group Sendroli_Group.old  # Backup if exists"
echo "    sudo mv [extracted-folder] Sendroli_Group"
echo "    sudo chown -R \$USER:\$USER /opt/Sendroli_Group"
echo "    chmod +x /opt/Sendroli_Group/deploy-to-ubuntu.sh"
echo ""
echo "5️⃣  Run deployment script:"
echo "    cd /opt/Sendroli_Group"
echo "    ./deploy-to-ubuntu.sh"
echo ""
echo "======================================"
echo ""

# Quick commands (edit the variables above first!)
echo "🎯 QUICK DEPLOY COMMANDS (After editing variables):"
echo ""
echo "# On your Mac:"
echo "cd /Users/root1/Sendroli_Group"
echo "tar czf sendroli-deploy.tar.gz --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='.DS_Store' --exclude='uploads' --exclude='dist' --exclude='build' --exclude='.vercel' ."
echo "scp -i $SSH_KEY sendroli-deploy.tar.gz $SSH_USER@$SERVER_IP:/tmp/"
echo ""
echo "# On your server:"
echo "ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
echo "cd /opt && sudo tar -xzf /tmp/sendroli-deploy.tar.gz && cd Sendroli_Group"
echo "./deploy-to-ubuntu.sh"
echo ""
