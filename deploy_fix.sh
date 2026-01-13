#!/bin/bash
set -e
cd /opt/Sendroli_Group

echo "====================================="
echo "   DEPLOYMENT FIX: API CONFIG"
echo "====================================="

# 1. Ensure .env is NOT ignored
if [ -f frontend/.dockerignore ]; then
    echo "[Config] Ensuring .env is included..."
    # If .env is explicitly minimized/removed, ensure we include it
    # Adding exception pattern !.env to end of file ensures it is included
    grep -q "!.env" frontend/.dockerignore || echo '!.env' >> frontend/.dockerignore
    echo "         Added !.env to .dockerignore"
fi

# 2. Update .env
echo "[Config] Configuring Frontend Env..."
# Use relative path /api to support both IP and Domain via Nginx reverse proxy
echo "VITE_API_URL=/api" > frontend/.env
echo "VITE_API_BASE_URL=/api" >> frontend/.env

echo "         Updated frontend/.env"
cat frontend/.env

# 3. Clean Build
echo "[Build]  Rebuilding Frontend (No Cache)..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

# 4. Restart
echo "[Deploy] Restarting Frontend Container..."
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend

echo "====================================="
echo "   SUCCESS! (Please Clear Cache)"
echo "====================================="
