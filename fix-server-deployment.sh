#!/bin/bash

###############################################################################
# Sendroli Group - Server Deployment Fix Script
# This script resolves port conflicts and deploys the application properly
###############################################################################

set -e

echo "========================================="
echo "Sendroli Group - Deployment Fix"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use: sudo ./fix-server-deployment.sh)"
    exit 1
fi

print_status "Running as root"
echo ""

# Step 1: Check what's using port 80
echo "Step 1: Checking port 80 usage..."
PORT_80_PROCESS=$(lsof -ti :80 || echo "")

if [ -n "$PORT_80_PROCESS" ]; then
    print_warning "Port 80 is in use by process(es): $PORT_80_PROCESS"
    
    # Check if it's nginx
    if systemctl is-active --quiet nginx; then
        print_warning "System nginx service is running"
        echo "Stopping system nginx service..."
        systemctl stop nginx
        systemctl disable nginx
        print_status "System nginx stopped and disabled"
    fi
    
    # Check if it's a Docker container
    DOCKER_CONTAINER=$(docker ps --filter "publish=80" --format "{{.Names}}" || echo "")
    if [ -n "$DOCKER_CONTAINER" ]; then
        print_warning "Docker container '$DOCKER_CONTAINER' is using port 80"
        echo "Stopping container..."
        docker stop "$DOCKER_CONTAINER" || true
        print_status "Container stopped"
    fi
else
    print_status "Port 80 is available"
fi
echo ""

# Step 2: Stop existing containers
echo "Step 2: Stopping existing Docker containers..."
cd /opt/Sendroli_Group
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
print_status "Existing containers stopped"
echo ""

# Step 3: Clean up Docker resources
echo "Step 3: Cleaning up Docker resources..."
docker system prune -f > /dev/null 2>&1 || true
print_status "Docker resources cleaned"
echo ""

# Step 4: Verify nginx directory structure
echo "Step 4: Verifying nginx configuration..."
if [ ! -d "nginx" ]; then
    print_error "nginx directory not found!"
    exit 1
fi

if [ ! -f "nginx/nginx.conf" ]; then
    print_error "nginx/nginx.conf not found!"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p nginx/logs
chmod 755 nginx/logs
print_status "Nginx configuration verified"
echo ""

# Step 5: Check environment files
echo "Step 5: Checking environment files..."
if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production not found!"
    print_warning "Please create backend/.env.production file"
    exit 1
fi

if [ ! -f "mongodb/.env" ]; then
    print_warning "mongodb/.env not found, creating default..."
    mkdir -p mongodb
    cat > mongodb/.env << 'EOF'
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_this_password_in_production
MONGO_INITDB_DATABASE=sendroli_factory
EOF
    chmod 600 mongodb/.env
    print_status "Created default mongodb/.env"
fi

print_status "Environment files checked"
echo ""

# Step 6: Build and start containers
echo "Step 6: Building and starting Docker containers..."
echo "This may take a few minutes..."
echo ""

docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans

if [ $? -eq 0 ]; then
    print_status "Containers started successfully"
else
    print_error "Failed to start containers"
    exit 1
fi
echo ""

# Step 7: Wait for services to be ready
echo "Step 7: Waiting for services to be ready..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Step 8: Verify services
echo "Step 8: Verifying services..."

# Check nginx
if docker exec sendroli-nginx nginx -t 2>/dev/null; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
fi

# Check backend
sleep 5
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "Backend is responding"
else
    print_warning "Backend is not responding yet (may still be starting)"
fi

# Check frontend via nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "Frontend (via nginx) is responding"
else
    print_warning "Frontend is not responding yet (may still be starting)"
fi
echo ""

# Step 9: Display logs for troubleshooting
echo "========================================="
echo "Recent logs from containers:"
echo "========================================="
echo ""
echo "--- Backend Logs ---"
docker logs --tail 20 sendroli-backend 2>&1 || true
echo ""
echo "--- Frontend Logs ---"
docker logs --tail 20 sendroli-frontend 2>&1 || true
echo ""
echo "--- Nginx Logs ---"
docker logs --tail 20 sendroli-nginx 2>&1 || true
echo ""

# Step 10: Display access information
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
print_status "Services are running"
echo ""
echo "Access your application:"
echo "  • Frontend: http://YOUR_SERVER_IP"
echo "  • Backend API: http://YOUR_SERVER_IP/api"
echo "  • Backend Direct: http://YOUR_SERVER_IP:5000/api"
echo ""
echo "Useful commands:"
echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  • Stop: docker-compose -f docker-compose.prod.yml down"
echo "  • Status: docker-compose -f docker-compose.prod.yml ps"
echo ""
print_warning "Remember to configure SSL certificates for production use!"
echo ""
