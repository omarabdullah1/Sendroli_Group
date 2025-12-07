#!/bin/bash
# SENDROLI FACTORY - Quick Console Setup
# Copy and paste this entire script into your VPS console, then press ENTER

echo "🚀 Starting Sendroli Factory Server Setup..."

# Add SSH key
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKgobyqcO6c99eEtof/hoCajXbk9JNPckN077fV7z+Tv root1@Roots-Mac-Pro.local" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✓ SSH key added"

# Configure SSH
systemctl enable sshd 2>/dev/null || systemctl enable ssh 2>/dev/null
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null
echo "✓ SSH service started"

# Configure firewall
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 5000/tcp
    echo "y" | ufw enable
    echo "✓ Firewall configured"
fi

# Update and install packages
apt-get update -qq
apt-get install -y curl wget git tar gzip
echo "✓ Packages installed"

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker && systemctl enable docker
    echo "✓ Docker installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    apt-get install -y docker-compose-plugin || {
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    }
    echo "✓ Docker Compose installed"
fi

# Create deployment directory
mkdir -p /opt/Sendroli_Group
echo "✓ Deployment directory created"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ SERVER SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Your server is now ready for deployment."
echo "Exit this console and test SSH from your local machine:"
echo "  ssh root@72.62.38.191"
echo ""
