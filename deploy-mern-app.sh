#!/bin/bash
# ==========================================
# SENDROLI FACTORY - MERN STACK DEPLOYMENT
# ==========================================
# Automated deployment script for Ubuntu VPS
# Deploys backend, frontend, and MongoDB

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="72.62.38.191"
SERVER_USER="root"
PROJECT_NAME="Sendroli_Group"
REMOTE_DIR="/opt/${PROJECT_NAME}"
LOCAL_DIR="$(pwd)"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if required files exist
check_requirements() {
    print_header "Checking Requirements"
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found!"
        exit 1
    fi
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found!"
        exit 1
    fi
    
    print_success "All required files found"
}

# Test SSH connection
test_connection() {
    print_header "Testing SSH Connection"
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} 'exit' 2>/dev/null; then
        print_success "SSH connection successful"
    else
        print_error "Cannot connect to server. Please check:"
        echo "  1. Server IP: ${SERVER_IP}"
        echo "  2. SSH key is added to ssh-agent: ssh-add ~/.ssh/id_ed25519"
        echo "  3. Server is accessible"
        exit 1
    fi
}

# Create environment files if they don't exist
setup_env_files() {
    print_header "Setting Up Environment Files"
    
    # Backend .env.production
    if [ ! -f "backend/.env.production" ]; then
        print_warning "Creating backend/.env.production"
        cat > backend/.env.production << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://sendroli_user:secure_password_change_me@mongodb:27017/sendroli_factory?authSource=admin

# JWT Configuration
JWT_SECRET=change_this_to_a_very_secure_random_string_minimum_32_characters
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://72.62.38.191

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=error
EOF
        print_warning "⚠ Please edit backend/.env.production and update:"
        echo "  - JWT_SECRET (use a strong random string)"
        echo "  - MONGODB_URI password"
        echo "  - CORS_ORIGIN (your domain or IP)"
    else
        print_success "Backend environment file exists"
    fi
    
    # MongoDB .env
    if [ ! -f "mongodb/.env" ]; then
        mkdir -p mongodb
        print_warning "Creating mongodb/.env"
        cat > mongodb/.env << 'EOF'
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=change_this_admin_password
MONGO_INITDB_DATABASE=sendroli_factory
EOF
        print_warning "⚠ Please edit mongodb/.env and update passwords"
    else
        print_success "MongoDB environment file exists"
    fi
}

# Create production Dockerfiles if they don't exist
create_dockerfiles() {
    print_header "Creating Dockerfiles"
    
    # Backend Dockerfile
    if [ ! -f "backend/Dockerfile" ]; then
        print_info "Creating backend/Dockerfile"
        cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
EOF
        print_success "Backend Dockerfile created"
    else
        print_success "Backend Dockerfile exists"
    fi
    
    # Frontend Dockerfile
    if [ ! -f "frontend/Dockerfile" ]; then
        print_info "Creating frontend/Dockerfile"
        cat > frontend/Dockerfile << 'EOF'
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
        print_success "Frontend Dockerfile created"
    else
        print_success "Frontend Dockerfile exists"
    fi
    
    # Frontend nginx configuration
    if [ ! -f "frontend/nginx.conf" ]; then
        print_info "Creating frontend/nginx.conf"
        cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        print_success "Frontend nginx.conf created"
    else
        print_success "Frontend nginx.conf exists"
    fi
}

# Sync files to server
sync_files() {
    print_header "Syncing Files to Server"
    
    print_info "Creating remote directory..."
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}"
    
    print_info "Syncing project files (this may take a few minutes)..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'frontend/dist' \
        --exclude 'frontend/node_modules' \
        --exclude 'backend/node_modules' \
        --exclude 'backend/logs' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude '*.md' \
        --exclude 'docs' \
        ${LOCAL_DIR}/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    
    print_success "Files synced successfully"
}

# Deploy on server
deploy_application() {
    print_header "Deploying Application on Server"
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

cd /opt/Sendroli_Group

echo "🔧 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "🗑️  Cleaning up old images..."
docker system prune -f

echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "📊 Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Your application is now running:"
echo "  Frontend: http://72.62.38.191"
echo "  Backend:  http://72.62.38.191:5000/api"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To check status:"
echo "  docker-compose -f docker-compose.prod.yml ps"
echo ""
ENDSSH

    print_success "Application deployed successfully!"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    print_info "Checking backend health..."
    if curl -f -s http://${SERVER_IP}:5000/api/health > /dev/null 2>&1; then
        print_success "Backend is responding"
    else
        print_warning "Backend health check failed (it may still be starting up)"
    fi
    
    print_info "Checking frontend..."
    if curl -f -s http://${SERVER_IP} > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend check failed (it may still be starting up)"
    fi
    
    echo ""
    print_info "Deployment complete! Visit: http://${SERVER_IP}"
}

# Main deployment flow
main() {
    clear
    print_header "SENDROLI FACTORY - MERN STACK DEPLOYMENT"
    
    echo "This script will:"
    echo "  1. Check requirements"
    echo "  2. Test SSH connection"
    echo "  3. Setup environment files"
    echo "  4. Create Dockerfiles"
    echo "  5. Sync files to server"
    echo "  6. Deploy with Docker Compose"
    echo "  7. Verify deployment"
    echo ""
    
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_requirements
    test_connection
    setup_env_files
    create_dockerfiles
    
    echo ""
    print_warning "IMPORTANT: Please review the .env files before continuing!"
    echo "  - backend/.env.production"
    echo "  - mongodb/.env"
    echo ""
    read -p "Have you reviewed the environment files? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please review .env files and run the script again"
        exit 0
    fi
    
    sync_files
    deploy_application
    verify_deployment
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
}

# Run main function
main
