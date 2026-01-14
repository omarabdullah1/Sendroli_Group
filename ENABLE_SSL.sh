#!/bin/bash

# Configuration
STORE_DOMAIN="store.sendroligroup.cloud"
MAIN_DOMAIN="sendroligroup.cloud"
EMAIL="admin@sendroligroup.cloud"

echo "======================================================="
echo "   SETTING UP SSL FOR $STORE_DOMAIN"
echo "======================================================="

# 1. Stop Nginx Container to free port 80
echo "--> Stopping Docker Nginx..."
docker stop sendroli-nginx 2>/dev/null || true

# 2. Request Certificate (Standalone Mode)
echo "--> Requesting SSL Certificate..."
# We try to get certs for BOTH domains if possible, or just STORE.
# Let's request for STORE first as requested.
certbot certonly --standalone -d $STORE_DOMAIN --non-interactive --agree-tos -m $EMAIL --keep-until-expiring

if [ ! -d "/etc/letsencrypt/live/$STORE_DOMAIN" ]; then
    echo "❌ Error: Certificate generation failed!"
    echo "Please check if your DNS A record points to this server."
    # Restart nginx so site isn't down
    docker start sendroli-nginx
    exit 1
fi

echo "✅ Certificate obtained successfully."

# 3. Update docker-compose.prod.yml to mount certificates
echo "--> Updating Docker Compose to mount certificates..."
# We use sed to insert the volume if not exists, or just rewrite the file is safer to ensure correctness.
# I'll rewrite it to be sure.

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

  store-frontend:
    build:
      context: ./store-frontend
      dockerfile: Dockerfile
    container_name: sendroli-store-frontend
    restart: unless-stopped
    ports:
      - "3001:80"
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
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/lib/letsencrypt:/var/lib/letsencrypt
    depends_on:
      - backend
      - frontend
      - store-frontend
    networks:
      - sendroli-network

volumes:
  mongodb_data:
    driver: local

networks:
  sendroli-network:
    driver: bridge
COMPOSE_EOF

# 4. Generate Nginx Config with SSL
echo "--> Configure Nginx with SSL..."

cat > nginx/nginx.conf << NGINX_EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    sendfile on;
    keepalive_timeout 65;

    upstream backend { server sendroli-backend:5000; }
    upstream frontend { server sendroli-frontend:80; }
    upstream store { server sendroli-store-frontend:80; }

    # 1. Store Subdomain - HTTP -> HTTPS
    server {
        listen 80;
        server_name $STORE_DOMAIN;
        return 301 https://\$host\$request_uri;
    }

    # 2. Store Subdomain - HTTPS
    server {
        listen 443 ssl;
        server_name $STORE_DOMAIN;

        ssl_certificate /etc/letsencrypt/live/$STORE_DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$STORE_DOMAIN/privkey.pem;

        location / {
            proxy_pass http://store;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }

    # 3. Main Dashboard (HTTP) - Assuming no cert for main yet
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
    }
}
NGINX_EOF

# 5. Restart Containers
echo "--> Restarting Containers..."
docker-compose -f docker-compose.prod.yml up -d --remove-orphans --force-recreate

echo "======================================================="
echo "   SSL SETUP COMPLETE!"
echo "   Store: https://$STORE_DOMAIN"
echo "======================================================="
