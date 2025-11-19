#!/bin/bash

# Quick deployment script for development/testing
# Use this for faster deployments without full checks

set -e

PROJECT_NAME="sendroli-factory"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🚀 Quick Deployment for $PROJECT_NAME"

# Quick checks
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml not found!"
    exit 1
fi

print_status "Pulling latest changes..."
git pull origin main

print_status "Stopping services..."
docker-compose -f docker-compose.prod.yml down

print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

print_status "Waiting for services to start..."
sleep 20

print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Quick health check
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    print_status "Backend health check passed!"
else
    print_warning "Backend health check failed"
fi

print_status "Quick deployment completed!"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"