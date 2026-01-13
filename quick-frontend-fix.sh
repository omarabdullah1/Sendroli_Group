#!/bin/bash

# Quick fix for frontend blue screen - update API URL and force clean rebuild

echo "Updating frontend .env file..."
echo "VITE_API_BASE_URL=http://72.62.38.191/api" > /opt/Sendroli_Group/frontend/.env

echo "Current frontend .env contents:"
cat /opt/Sendroli_Group/frontend/.env

echo ""
echo "Clearing Docker build cache for frontend..."
cd /opt/Sendroli_Group
docker builder prune -f

echo ""
echo "Rebuilding frontend container WITHOUT cache..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

echo ""
echo "Recreating frontend container..."
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps frontend

echo ""
echo "Waiting for frontend to start..."
sleep 15

echo ""
echo "Frontend container status:"
docker compose -f docker-compose.prod.yml ps frontend

echo ""
echo "Checking frontend logs for API configuration..."
docker compose -f docker-compose.prod.yml logs frontend | grep "API" || echo "No API logs yet"

echo ""
echo "Done! Please refresh your browser at http://72.62.38.191"
echo "Use Ctrl+Shift+R to force refresh and clear browser cache"

