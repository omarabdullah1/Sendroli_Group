#!/bin/bash

###############################################################################
# SSL Certificate Setup with Let's Encrypt
# This script sets up automatic SSL certificates for your domain
###############################################################################

set -e

echo "========================================="
echo "SSL Certificate Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use: sudo ./setup-ssl-certificate.sh)"
    exit 1
fi

# Prompt for domain name
read -p "Enter your domain name (e.g., sendroli.com or leave empty to skip SSL): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "No domain provided. Skipping SSL setup."
    echo "Your site will run on HTTP only (not recommended for production)."
    exit 0
fi

echo ""
echo "Setting up SSL for domain: $DOMAIN_NAME"
echo ""

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y certbot python3-certbot-nginx
    else
        echo "Unsupported OS. Please install certbot manually."
        exit 1
    fi
    echo "✓ Certbot installed"
fi

# Create certbot directories
mkdir -p /var/www/certbot
mkdir -p /opt/Sendroli_Group/nginx/ssl

cd /opt/Sendroli_Group

# Update nginx configuration for certbot challenge
cat > nginx/nginx-certbot.conf << 'NGINX_CERTBOT_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name DOMAIN_PLACEHOLDER;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 "Preparing SSL certificate...\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_CERTBOT_EOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" nginx/nginx-certbot.conf

# Stop existing containers
echo "Stopping containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Start temporary nginx for certbot
echo "Starting temporary nginx for certificate verification..."
docker run -d --name temp-nginx \
    -p 80:80 \
    -v /opt/Sendroli_Group/nginx/nginx-certbot.conf:/etc/nginx/nginx.conf:ro \
    -v /var/www/certbot:/var/www/certbot:ro \
    nginx:alpine

sleep 5

# Obtain SSL certificate
echo ""
echo "Obtaining SSL certificate from Let's Encrypt..."
echo "This may take a minute..."
echo ""

certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@${DOMAIN_NAME} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN_NAME}

if [ $? -eq 0 ]; then
    echo "✓ SSL certificate obtained successfully!"
    
    # Copy certificates to nginx directory
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem /opt/Sendroli_Group/nginx/ssl/
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem /opt/Sendroli_Group/nginx/ssl/
    chmod 644 /opt/Sendroli_Group/nginx/ssl/fullchain.pem
    chmod 600 /opt/Sendroli_Group/nginx/ssl/privkey.pem
    
    echo "✓ Certificates copied to nginx/ssl/"
else
    echo "✗ Failed to obtain SSL certificate"
    docker stop temp-nginx && docker rm temp-nginx
    exit 1
fi

# Stop temporary nginx
docker stop temp-nginx && docker rm temp-nginx

# Create production nginx config with SSL
cat > nginx/nginx.conf << 'NGINX_SSL_EOF'
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

    # HTTP - Redirect to HTTPS
    server {
        listen 80;
        server_name DOMAIN_PLACEHOLDER;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name DOMAIN_PLACEHOLDER;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
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

        # API endpoints
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

        # Login rate limiting
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
NGINX_SSL_EOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" nginx/nginx.conf

# Update docker-compose to include certbot volume
cat > docker-compose-ssl.yml << 'COMPOSE_SSL_EOF'
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
      - /var/www/certbot:/var/www/certbot
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
COMPOSE_SSL_EOF

# Start all services with SSL
echo ""
echo "Starting services with SSL enabled..."
docker-compose -f docker-compose-ssl.yml up -d --build

sleep 10

# Setup auto-renewal cron job
echo ""
echo "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/${DOMAIN_NAME}/*.pem /opt/Sendroli_Group/nginx/ssl/ && docker restart sendroli-nginx") | crontab -
echo "✓ Auto-renewal configured (runs daily at 3 AM)"

# Test the setup
echo ""
echo "========================================="
echo "Testing SSL Setup..."
echo "========================================="
sleep 5

echo ""
curl -k https://${DOMAIN_NAME}/health && echo "✓ HTTPS is working!" || echo "✗ HTTPS not responding"
curl http://${DOMAIN_NAME}/health && echo "✓ HTTP redirect working!" || echo "✗ HTTP not redirecting"

echo ""
echo "========================================="
echo "SSL SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Your site is now secured with HTTPS!"
echo ""
echo "Access your application at:"
echo "  https://${DOMAIN_NAME}"
echo ""
echo "Certificate will auto-renew every 90 days."
echo ""
echo "To check SSL certificate:"
echo "  openssl s_client -connect ${DOMAIN_NAME}:443 -servername ${DOMAIN_NAME}"
echo ""
