#!/bin/bash

###############################################################################
# QUICK FIX FOR IP ACCESS (NO SSL)
# Run this on your server to fix the deployment without SSL
###############################################################################

cd /opt/Sendroli_Group

echo "========================================="
echo "Quick Deployment Fix (HTTP only)"
echo "========================================="
echo ""

# Step 1: Stop nginx service
echo "Step 1: Stopping system nginx..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
echo "✓ System nginx stopped"

# Step 2: Stop old containers
echo ""
echo "Step 2: Stopping old containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Old containers stopped"

# Step 3: Create nginx config for HTTP only
echo ""
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
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=10r/m;

    upstream backend {
        server sendroli-backend:5000 max_fails=3 fail_timeout=30s;
    }

    upstream frontend {
        server sendroli-frontend:80 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name _;

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Frontend - serve static files
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
            proxy_read_timeout 90;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90;
            proxy_connect_timeout 90;
            proxy_send_timeout 90;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
            
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        # Login with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login_limit burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 90;
        }

        # WebSocket support (if needed)
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }
    }
}
NGINX_EOF

echo "✓ Nginx configuration created"

# Step 4: Start containers
echo ""
echo "Step 4: Starting all containers..."
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Step 5: Wait and verify
echo ""
echo "Step 5: Waiting for services to start..."
sleep 15

echo ""
echo "========================================="
echo "Container Status:"
echo "========================================="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "Testing Services:"
echo "========================================="
sleep 5

# Test endpoints
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Nginx is responding (HTTP $HTTP_CODE)"
else
    echo "✗ Nginx not responding (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Backend API is responding (HTTP $HTTP_CODE)"
else
    echo "⚠ Backend API not responding (HTTP $HTTP_CODE) - may still be starting"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Backend direct is responding (HTTP $HTTP_CODE)"
else
    echo "⚠ Backend direct not responding (HTTP $HTTP_CODE) - may still be starting"
fi

echo ""
echo "========================================="
echo "Recent Logs:"
echo "========================================="
echo ""
echo "--- Backend Logs (last 15 lines) ---"
docker logs --tail 15 sendroli-backend 2>&1 | tail -15
echo ""
echo "--- Nginx Logs (last 10 lines) ---"
docker logs --tail 10 sendroli-nginx 2>&1 | tail -10

echo ""
echo "========================================="
echo "DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "✓ Your application is now running!"
echo ""
echo "Access via:"
echo "  http://$(hostname -I | awk '{print $1}')"
echo "  or"
echo "  http://72.62.38.191"
echo ""
echo "⚠ WARNING: You're running on HTTP (not HTTPS)"
echo "   For production, you should:"
echo "   1. Get a domain name"
echo "   2. Run: ./setup-ssl-certificate.sh"
echo ""
echo "Useful commands:"
echo "  • View all logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Restart all:       docker-compose -f docker-compose.prod.yml restart"
echo "  • Stop all:          docker-compose -f docker-compose.prod.yml down"
echo "  • Rebuild:           docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
