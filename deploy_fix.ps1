# Deploy Fixes for Sendroli Group

$SERVER_IP = "72.62.38.191"
$USER = "root"

Write-Host "Starting Access Fix Upload..." -ForegroundColor Cyan
Write-Host "You will be asked for your password (O6mglj4u) multiple times." -ForegroundColor Yellow

# 1. Upload Store Frontend Dockerfile
Write-Host "Uploading store-frontend/Dockerfile..."
scp store-frontend/Dockerfile ${USER}@${SERVER_IP}:/opt/Sendroli_Group/store-frontend/

# 2. Upload Docker Compose Config
Write-Host "Uploading docker-compose.prod.yml..."
scp docker-compose.prod.yml ${USER}@${SERVER_IP}:/opt/Sendroli_Group/

# 3. Upload Backend Package Files (Dependencies)
Write-Host "Uploading backend package.json and package-lock.json..."
scp backend/package.json backend/package-lock.json ${USER}@${SERVER_IP}:/opt/Sendroli_Group/backend/

# 4. Upload Backend Middleware (Upload Logic)
Write-Host "Uploading backend/middleware/upload.js..."
scp backend/middleware/upload.js ${USER}@${SERVER_IP}:/opt/Sendroli_Group/backend/middleware/

Write-Host "`nUploads Complete!" -ForegroundColor Green
Write-Host "Now, please login to your server and run the Rebuild Command:" -ForegroundColor Cyan
Write-Host "ssh ${USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "`nTHEN COPY AND RUN THIS ON THE SERVER:" -ForegroundColor Yellow
Write-Host "cd /opt/Sendroli_Group"
Write-Host "docker compose -f docker-compose.prod.yml build --no-cache"
Write-Host "docker compose -f docker-compose.prod.yml up -d"
