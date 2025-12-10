#!/bin/bash

###############################################################################
# SERVER DEPLOYMENT COMMANDS - COPY AND PASTE ON YOUR SERVER
# Run as: ssh root@YOUR_SERVER and then paste these commands
###############################################################################

cd /opt/Sendroli_Group

# Step 1: Stop nginx service if running
echo "Step 1: Stopping system nginx..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

# Step 2: Stop and remove old containers
echo "Step 2: Stopping old containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Step 3: Create nginx directory and configuration
echo "Step 3: Creating nginx configuration..."
mkdir -p nginx/logs nginx/ssl

cat > nginx/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    upstream backend {
        server sendroli-backend:5000;
    }

    upstream frontend {
        server sendroli-frontend:80;
    }

    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINX_EOF

echo "✓ Nginx configuration created"

# Step 4: Update docker-compose.prod.yml
echo "Step 4: Updating docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: sendroli-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env.production
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    networks:
      - sendroli-network
    volumes:
      - ./backend/logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sendroli-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - sendroli-network

  mongodb:
    image: mongo:6.0
    container_name: sendroli-mongodb
    restart: unless-stopped
    env_file:
      - ./mongodb/.env
    ports:
      - "27017:27017"
    networks:
      - sendroli-network
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/init:/docker-entrypoint-initdb.d
    command: mongod --auth

  nginx:
    image: nginx:alpine
    container_name: sendroli-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - sendroli-network

volumes:
  mongodb_data:
    driver: local

networks:
  sendroli-network:
    driver: bridge
COMPOSE_EOF

echo "✓ docker-compose.prod.yml updated"

# Step 5: Clean up Docker
echo "Step 5: Cleaning Docker resources..."
docker system prune -f

# Step 6: Start containers
echo "Step 6: Building and starting containers..."
echo "This will take a few minutes..."
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Step 7: Wait and check
echo "Step 7: Waiting for services to start..."
sleep 15

echo ""
echo "========================================="
echo "Container Status:"
echo "========================================="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "Testing Endpoints:"
echo "========================================="
sleep 5
curl -s http://localhost/health && echo "✓ Nginx is responding" || echo "✗ Nginx not responding"
curl -s http://localhost/api/health && echo "✓ Backend API is responding" || echo "✗ Backend API not responding"
curl -s http://localhost:5000/api/health && echo "✓ Backend direct is responding" || echo "✗ Backend direct not responding"

echo ""
echo "========================================="
echo "Recent Logs:"
echo "========================================="
echo ""
echo "--- Backend Logs ---"
docker logs --tail 20 sendroli-backend
echo ""
echo "--- Frontend Logs ---"
docker logs --tail 20 sendroli-frontend
echo ""
echo "--- Nginx Logs ---"
docker logs --tail 20 sendroli-nginx

echo ""
echo "========================================="
echo "DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Your application is now running at:"
echo "  http://YOUR_SERVER_IP"
echo ""
echo "Useful commands:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo "  docker-compose -f docker-compose.prod.yml restart"
echo "  docker-compose -f docker-compose.prod.yml ps"
echo ""
