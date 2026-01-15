#!/bin/bash

echo "=== 1. Checking Docker Containers Status ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Health}}"

echo -e "\n=== 2. Backend Container Logs (Last 50 lines) ==="
docker logs --tail 50 sendroli-backend

echo -e "\n=== 3. Backend Health Check (Internal) ==="
# Try to curl localhost:5000 from host (since port is mapped)
curl -v http://localhost:5000/api/health

echo -e "\n=== 4. Test Network from Nginx Container ==="
# Check if Nginx can reach Backend
docker exec sendroli-nginx curl -v http://sendroli-backend:5000/api/health

echo -e "\n=== 5. Nginx Logs (Last 20 lines) ==="
docker logs --tail 20 sendroli-nginx
