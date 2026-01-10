###############################################################################
# AUTOMATED DEPLOYMENT TO UBUNTU SERVER (PowerShell Version)
# Server IP: 72.62.38.191
# SSH Key: ~/.ssh/id_ed25519
###############################################################################

$SERVER_IP = "72.62.38.191"
$SSH_USER = "root"
$REMOTE_DIR = "/opt/Sendroli_Group"
$LOCAL_DIR = Get-Location

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   SENDROLI FACTORY MANAGEMENT - SERVER DEPLOYMENT         ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Step 1: Test SSH Connection
Write-Host "[1/7] Testing SSH connection to server..." -ForegroundColor Yellow
$sshTest = ssh -i "$HOME/.ssh/id_ed25519" -o ConnectTimeout=10 root@72.62.38.191 "echo 'Connection OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "✗ SSH connection failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package
Write-Host ""
Write-Host "[2/7] Creating deployment package..." -ForegroundColor Yellow

$excludeDirs = @(
    "node_modules",
    ".git",
    ".env",
    ".env.*",
    "*.log",
    ".DS_Store",
    "uploads",
    "frontend/dist",
    "frontend/build",
    "backend/uploads",
    ".vercel",
    "coverage"
)

$archivePath = "$env:TEMP\sendroli-deploy.tar.gz"

# Create tar.gz using WSL or tar command if available
Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Step 3: Transfer files
Write-Host "`n[3/6] Transferring files to server..." -ForegroundColor Yellow
scp -i "$HOME/.ssh/id_ed25519" -o StrictHostKeyChecking=no -r `
    backend frontend package.json docker-compose.prod.yml deploy-to-ubuntu.sh nginx.conf `
    root@72.62.38.191:/tmp/sendroli-deploy/
