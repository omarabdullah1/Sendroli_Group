#!/bin/bash
# Quick Server Deployment Commands
# Copy and paste these commands on your server (srv1134605)

echo "==================================="
echo "Sendroli Group - Quick Deploy"
echo "==================================="

# Navigate to project directory
cd /opt/Sendroli_Group

# Pull latest changes (if using git)
# git pull origin main

# Stop any service using port 80
echo "Stopping nginx service if running..."
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Clean up
echo "Cleaning up..."
docker system prune -f

# Create necessary directories
mkdir -p nginx/logs nginx/ssl mongodb

# Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Wait for services
echo "Waiting for services to start..."
sleep 15

# Check status
echo ""
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Testing endpoints..."
curl -s http://localhost/health && echo "✓ Nginx is responding"
curl -s http://localhost/api/health && echo "✓ Backend API is responding (via nginx)"
curl -s http://localhost:5000/api/health && echo "✓ Backend is responding (direct)"

echo ""
echo "View logs with: docker-compose -f docker-compose.prod.yml logs -f"
