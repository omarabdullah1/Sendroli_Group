#!/bin/bash

# Sendroli Factory Management - VPS Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sendroli-factory"
BACKUP_DIR="/var/backups/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME-deploy.log"

echo -e "${BLUE}🚀 Starting Sendroli Factory Management Deployment${NC}"
echo "Timestamp: $(date)"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists git; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_status "All prerequisites satisfied"

# Create necessary directories
print_status "Creating necessary directories..."
sudo mkdir -p $BACKUP_DIR
sudo mkdir -p /var/log
sudo touch $LOG_FILE
sudo chmod 644 $LOG_FILE

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/mongodb-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    if docker ps | grep -q sendroli-mongodb; then
        docker exec sendroli-mongodb mongodump --out /tmp/backup
        docker cp sendroli-mongodb:/tmp/backup ./mongodb-backup
        tar -czf $BACKUP_FILE ./mongodb-backup
        rm -rf ./mongodb-backup
        print_status "Database backup created: $BACKUP_FILE"
    else
        print_warning "MongoDB container not found, skipping backup"
    fi
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "./backend/.env.production" ]; then
        print_warning "Backend production environment file not found"
        print_status "Creating from example..."
        cp ./backend/.env.production.example ./backend/.env.production
        print_warning "Please edit backend/.env.production with your actual values!"
    fi
    
    # Frontend environment
    if [ ! -f "./frontend/.env.production" ]; then
        print_warning "Frontend production environment file not found"
        print_status "Creating from example..."
        cp ./frontend/.env.production.example ./frontend/.env.production
        print_warning "Please edit frontend/.env.production with your actual values!"
    fi
    
    # MongoDB environment
    if [ ! -f "./mongodb/.env" ]; then
        print_warning "MongoDB environment file not found"
        print_status "Creating from example..."
        mkdir -p ./mongodb
        cp ./mongodb/.env.example ./mongodb/.env
        print_warning "Please edit mongodb/.env with your actual values!"
    fi
}

# Function to pull latest code
update_code() {
    print_status "Pulling latest code from repository..."
    
    # Stash any local changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Local changes detected, stashing..."
        git stash
    fi
    
    # Pull latest changes
    git pull origin main
    
    print_status "Code updated successfully"
}

# Function to build and deploy
deploy_application() {
    print_status "Building and deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    
    # Remove old images (optional, saves space)
    print_status "Cleaning up old images..."
    docker image prune -f
    
    # Build and start new containers
    print_status "Building and starting containers..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_status "Services are running successfully"
    else
        print_error "Some services failed to start"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Function to run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check backend health
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check if frontend is accessible
    if curl -f http://localhost:80 >/dev/null 2>&1; then
        print_status "Frontend is accessible"
    else
        print_warning "Frontend accessibility check failed (might be normal for some setups)"
    fi
    
    # Check database connection
    if docker exec sendroli-backend npm run db:check >/dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_warning "Database connection check failed"
    fi
}

# Function to show deployment summary
show_summary() {
    echo
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "=================================="
    echo "Project: $PROJECT_NAME"
    echo "Deployment time: $(date)"
    echo "Services status:"
    docker-compose -f docker-compose.prod.yml ps
    echo
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo
    echo "Access your application:"
    echo "- Frontend: http://your-server-ip/"
    echo "- Backend API: http://your-server-ip:5000/api"
    echo "- Health Check: http://your-server-ip:5000/api/health"
    echo
    echo "Useful commands:"
    echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "- Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "- Stop services: docker-compose -f docker-compose.prod.yml down"
    echo
}

# Main deployment process
main() {
    echo "Starting deployment process..." | tee -a $LOG_FILE
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found. Are you in the project root directory?"
        exit 1
    fi
    
    # Ask for confirmation in production
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    # Execute deployment steps
    backup_database 2>&1 | tee -a $LOG_FILE
    setup_environment 2>&1 | tee -a $LOG_FILE
    update_code 2>&1 | tee -a $LOG_FILE
    deploy_application 2>&1 | tee -a $LOG_FILE
    health_check 2>&1 | tee -a $LOG_FILE
    show_summary 2>&1 | tee -a $LOG_FILE
    
    echo "Deployment completed at $(date)" | tee -a $LOG_FILE
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        backup_database
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "stop")
        print_status "Stopping all services..."
        docker-compose -f docker-compose.prod.yml down
        ;;
    "restart")
        print_status "Restarting all services..."
        docker-compose -f docker-compose.prod.yml restart
        ;;
    *)
        echo "Usage: $0 {deploy|backup|health|logs|stop|restart}"
        echo "  deploy  - Full deployment process (default)"
        echo "  backup  - Create database backup only"
        echo "  health  - Run health checks only"
        echo "  logs    - Show live logs"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        exit 1
        ;;
esac