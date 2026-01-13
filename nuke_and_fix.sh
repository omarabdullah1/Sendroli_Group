#!/bin/bash
set -e
cd /opt/Sendroli_Group

echo ">>> STARTING AUTOMATED FIX <<<"

# 1. DELETE conflicting files
echo "[1/4] Removing .env.production..."
if [ -f frontend/.env.production ]; then
    rm frontend/.env.production
    echo "      Deleted .env.production"
else
    echo "      .env.production not found (good)"
fi

rm -f frontend/.env.local

# 2. UPDATE .env
echo "[2/4] Setting up .env..."
echo "VITE_API_URL=/api" > frontend/.env
echo "VITE_API_BASE_URL=/api" >> frontend/.env
cat frontend/.env

# 3. VERIFY Dockerignore (Just in case user added exclusion)
# If .env is excluded !.env re-includes it
if [ -f frontend/.dockerignore ]; then
    grep -q "!.env" frontend/.dockerignore || echo '!.env' >> frontend/.dockerignore
fi

# 4. REBUILD
echo "[3/4] Rebuilding Frontend (No Cache)..."
# Force build log output
docker compose -f docker-compose.prod.yml build --no-cache frontend

# 5. RESTART
echo "[4/4] Restarting Container..."
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend

echo ">>> FIX COMPLETED. PLEASE REFRESH. <<<"
