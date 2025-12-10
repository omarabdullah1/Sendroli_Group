#!/bin/bash
set -e

DOMAIN_NAME="sendroligroup.cloud"
EMAIL="admin@sendroligroup.cloud"

echo "Starting Auto SSL Setup for $DOMAIN_NAME..."

# Install certbot
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

cd /opt/Sendroli_Group

# Stop existing containers
echo "Stopping services..."
docker compose -f docker-compose.prod.yml down || true

# Create directories
mkdir -p nginx/ssl nginx/logs /var/www/certbot

# Create temp nginx config
cat > /tmp/nginx-temp.conf << TEMP_NGINX
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name ${DOMAIN_NAME};
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 "SSL setup in progress...\n"; add_header Content-Type text/plain; }
    }
}
TEMP_NGINX

# Start temp nginx
echo "Starting temporary Nginx..."
docker run -d --name temp-nginx-certbot \
    -p 80:80 \
    -v /tmp/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    -v /var/www/certbot:/var/www/certbot:ro \
    nginx:alpine

sleep 5

# Obtain cert
echo "Requesting certificate..."
certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    --non-interactive \
    -d ${DOMAIN_NAME}

# Copy certs
echo "Copying certificates..."
cp /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem nginx/ssl/
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem

# Stop temp nginx
docker stop temp-nginx-certbot && docker rm temp-nginx-certbot

# Create production nginx config
echo "Creating production Nginx config..."
cat > nginx/nginx.conf << PROD_NGINX
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

    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=50r/s;
    limit_req_zone \$binary_remote_addr zone=login_limit:10m rate=10r/m;

    upstream backend {
        server sendroli-backend:5000 max_fails=3 fail_timeout=30s;
    }

    upstream frontend {
        server sendroli-frontend:80 max_fails=3 fail_timeout=30s;
    }

    # HTTP - Redirect to HTTPS
    server {
        listen 80;
        server_name ${DOMAIN_NAME};

        # Allow Let's Encrypt renewal
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect everything else to HTTPS
        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        # http2 on; # Commented out to ensure compatibility if nginx version varies
        server_name ${DOMAIN_NAME};

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
PROD_NGINX

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "SSL Setup Complete!"
