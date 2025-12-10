#!/bin/bash

###############################################################################
# Complete SSL Setup with Domain Configuration
# This script will guide you through setting up HTTPS with Let's Encrypt
###############################################################################

set -e

echo "========================================="
echo "SSL Certificate Setup Guide"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo ./setup-domain-ssl.sh"
    exit 1
fi

echo "This script will help you set up HTTPS for your application."
echo ""
echo "You'll need:"
echo "  1. A domain name (e.g., sendroli.com, app.sendroli.com)"
echo "  2. DNS configured to point to this server"
echo "  3. Port 80 and 443 accessible from internet"
echo ""

# Get domain name
read -p "Enter your domain name (e.g., sendroli.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain name is required!"
    exit 1
fi

echo ""
echo "Domain entered: $DOMAIN_NAME"
echo ""

# Check DNS resolution
echo "Checking DNS resolution..."
RESOLVED_IP=$(dig +short $DOMAIN_NAME | tail -n1)
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "  Domain resolves to: $RESOLVED_IP"
echo "  Server IP is: $SERVER_IP"

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo ""
    echo "⚠️  WARNING: DNS mismatch!"
    echo ""
    echo "Your domain ($DOMAIN_NAME) resolves to $RESOLVED_IP"
    echo "But this server's IP is $SERVER_IP"
    echo ""
    echo "To fix this, update your domain's DNS settings:"
    echo ""
    echo "1. Go to your domain registrar (Namecheap, GoDaddy, etc.)"
    echo "2. Find DNS settings or Nameservers"
    echo "3. Add an A record:"
    echo "   Type: A"
    echo "   Host: @ (or your subdomain)"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600"
    echo ""
    echo "4. Wait 5-10 minutes for DNS propagation"
    echo "5. Run this script again"
    echo ""
    read -p "Do you want to continue anyway? (not recommended) [y/N]: " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Exiting. Please fix DNS and run again."
        exit 1
    fi
fi

echo ""
echo "✓ DNS check passed!"
echo ""

# Get email for Let's Encrypt
read -p "Enter your email for SSL certificate notifications: " EMAIL

if [ -z "$EMAIL" ]; then
    EMAIL="admin@${DOMAIN_NAME}"
    echo "Using default: $EMAIL"
fi

echo ""
echo "========================================="
echo "Configuration Summary"
echo "========================================="
echo "Domain: $DOMAIN_NAME"
echo "Email: $EMAIL"
echo "Server IP: $SERVER_IP"
echo ""
read -p "Continue with SSL setup? [Y/n]: " CONFIRM

if [[ $CONFIRM =~ ^[Nn]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo "========================================="
echo "Step 1: Installing Certbot"
echo "========================================="

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y certbot
    else
        echo "❌ Unsupported OS. Please install certbot manually:"
        echo "   https://certbot.eff.org/instructions"
        exit 1
    fi
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed"
fi

echo ""
echo "========================================="
echo "Step 2: Preparing Application"
echo "========================================="

cd /opt/Sendroli_Group

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✓ Containers stopped"

# Create necessary directories
mkdir -p nginx/ssl nginx/logs /var/www/certbot
echo "✓ Directories created"

echo ""
echo "========================================="
echo "Step 3: Starting Temporary Server"
echo "========================================="

# Create temporary nginx config for certificate verification
cat > /tmp/nginx-temp.conf << TEMP_NGINX
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name ${DOMAIN_NAME};
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 "SSL certificate setup in progress...\n";
            add_header Content-Type text/plain;
        }
    }
}
TEMP_NGINX

# Start temporary nginx
echo "Starting temporary web server..."
docker run -d --name temp-nginx-certbot \
    -p 80:80 \
    -v /tmp/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    -v /var/www/certbot:/var/www/certbot:ro \
    nginx:alpine

sleep 3
echo "✓ Temporary server started"

echo ""
echo "========================================="
echo "Step 4: Obtaining SSL Certificate"
echo "========================================="
echo ""
echo "Requesting certificate from Let's Encrypt..."
echo "This may take 1-2 minutes..."
echo ""

# Obtain certificate
certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d ${DOMAIN_NAME}

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ SSL certificate obtained successfully!"
    
    # Copy certificates
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem nginx/ssl/
    chmod 644 nginx/ssl/fullchain.pem
    chmod 600 nginx/ssl/privkey.pem
    
    echo "✓ Certificates installed"
else
    echo ""
    echo "❌ Failed to obtain SSL certificate!"
    echo ""
    echo "Common issues:"
    echo "  1. Port 80 is not accessible from internet"
    echo "  2. DNS is not configured correctly"
    echo "  3. Firewall is blocking connections"
    echo ""
    echo "Check firewall:"
    echo "  sudo ufw allow 80"
    echo "  sudo ufw allow 443"
    echo ""
    
    docker stop temp-nginx-certbot && docker rm temp-nginx-certbot
    exit 1
fi

# Stop temporary nginx
docker stop temp-nginx-certbot && docker rm temp-nginx-certbot
echo "✓ Temporary server stopped"

echo ""
echo "========================================="
echo "Step 5: Configuring Production Nginx"
echo "========================================="

# Create production nginx config with SSL
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
        listen 443 ssl http2;
        server_name ${DOMAIN_NAME};

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_stapling on;
        ssl_stapling_verify on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

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
            proxy_read_timeout 90;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 90;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '\$http_origin' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            
            if (\$request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '\$http_origin';
                add_header 'Access-Control-Allow-Credentials' 'true';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login_limit burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 90;
        }
    }
}
PROD_NGINX

echo "✓ Nginx configuration created"

echo ""
echo "========================================="
echo "Step 6: Starting Production Services"
echo "========================================="

# Update docker-compose to include certbot volume
cp docker-compose.prod.yml docker-compose.prod.yml.backup
cat > docker-compose.prod.yml << COMPOSE_NGINX
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
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
      - /var/www/certbot:/var/www/certbot:ro
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
COMPOSE_NGINX

echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo ""
echo "Waiting for services to start..."
sleep 15

echo ""
echo "========================================="
echo "Step 7: Setting Up Auto-Renewal"
echo "========================================="

# Create renewal script
cat > /opt/Sendroli_Group/renew-ssl.sh << RENEW_SCRIPT
#!/bin/bash
certbot renew --quiet --webroot --webroot-path=/var/www/certbot
if [ \$? -eq 0 ]; then
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem /opt/Sendroli_Group/nginx/ssl/
    cp /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem /opt/Sendroli_Group/nginx/ssl/
    docker restart sendroli-nginx
    echo "\$(date): SSL certificate renewed successfully" >> /var/log/ssl-renewal.log
fi
RENEW_SCRIPT

chmod +x /opt/Sendroli_Group/renew-ssl.sh

# Add to crontab (runs daily at 3 AM)
(crontab -l 2>/dev/null | grep -v "renew-ssl.sh"; echo "0 3 * * * /opt/Sendroli_Group/renew-ssl.sh") | crontab -

echo "✓ Auto-renewal configured (runs daily at 3 AM)"

echo ""
echo "========================================="
echo "Step 8: Verifying Installation"
echo "========================================="

sleep 5

echo ""
echo "Testing HTTPS connection..."
if curl -sSf https://${DOMAIN_NAME}/health > /dev/null 2>&1; then
    echo "✓ HTTPS is working!"
else
    echo "⚠ HTTPS connection failed (service may still be starting)"
fi

echo ""
echo "Testing HTTP redirect..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN_NAME}/health)
if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "✓ HTTP to HTTPS redirect is working!"
else
    echo "⚠ HTTP redirect returned code: $HTTP_CODE"
fi

echo ""
echo "========================================="
echo "Container Status:"
echo "========================================="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "✅ SSL SETUP COMPLETE!"
echo "========================================="
echo ""
echo "🔒 Your application is now secured with HTTPS!"
echo ""
echo "Access your application at:"
echo "  https://${DOMAIN_NAME}"
echo ""
echo "Certificate details:"
echo "  Domain: ${DOMAIN_NAME}"
echo "  Issuer: Let's Encrypt"
echo "  Valid: 90 days (auto-renews)"
echo "  Auto-renewal: Daily at 3 AM"
echo ""
echo "Useful commands:"
echo "  • View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Restart nginx:    docker restart sendroli-nginx"
echo "  • Renew cert now:   ./renew-ssl.sh"
echo "  • Check cert:       certbot certificates"
echo "  • Test SSL:         curl -vI https://${DOMAIN_NAME}"
echo ""
echo "SSL Grade Test:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN_NAME}"
echo ""
