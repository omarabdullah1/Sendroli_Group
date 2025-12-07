#!/bin/bash

###############################################################################
# Clean Vercel and Other Platform References
# This script removes all Vercel-specific files and configurations
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Cleaning Vercel and Platform-Specific Files          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Remove Vercel directories
print_info "Removing Vercel directories..."
rm -rf .vercel
rm -rf backend/.vercel
rm -rf frontend/.vercel
print_success "Vercel directories removed"

# Remove Vercel configuration files
print_info "Removing Vercel configuration files..."
rm -f vercel.json
rm -f backend/vercel.json
rm -f frontend/vercel.json
print_success "Vercel configuration files removed"

# Remove deployment-related scripts that reference Vercel
print_info "Cleaning deployment scripts..."
if [ -f "deploy-fixes.sh" ]; then
    # Backup first
    cp deploy-fixes.sh deploy-fixes.sh.backup
    print_info "Backed up deploy-fixes.sh"
fi

# Remove test scripts with Vercel URLs
print_info "Cleaning test scripts with Vercel references..."
files_to_clean=(
    "test_production_notifications.sh"
    "test_user_role.js"
)

for file in "${files_to_clean[@]}"; do
    if [ -f "$file" ]; then
        print_info "Creating backup of $file"
        cp "$file" "$file.backup"
    fi
done

print_success "Test scripts backed up"

# Create a list of files containing Vercel references
print_info "Scanning for remaining Vercel references..."
echo -e "\n${YELLOW}Files still containing Vercel references:${NC}"
grep -r "vercel" --include="*.js" --include="*.md" --include="*.sh" --include="*.json" . 2>/dev/null | \
    grep -v "node_modules" | \
    grep -v ".backup" | \
    grep -v "UBUNTU_SERVER_DEPLOYMENT" | \
    cut -d: -f1 | \
    sort -u || echo "None found"

# Clean git cache if needed
print_info "Cleaning git cache..."
git rm -r --cached .vercel 2>/dev/null || true
git rm --cached vercel.json 2>/dev/null || true
git rm --cached backend/vercel.json 2>/dev/null || true
git rm --cached frontend/vercel.json 2>/dev/null || true

# Update .gitignore to prevent future additions
print_info "Updating .gitignore..."
if ! grep -q "^.vercel$" .gitignore; then
    echo -e "\n# Vercel deployment files\n.vercel\n*.vercel.json" >> .gitignore
fi
print_success ".gitignore updated"

# Create a summary file
cat > CLEANUP_SUMMARY.md <<EOF
# Vercel Cleanup Summary

## Files Removed
- \`.vercel/\` directories (root, backend, frontend)
- \`vercel.json\` files (root, backend, frontend)

## Files Backed Up
- \`deploy-fixes.sh\` → \`deploy-fixes.sh.backup\`
- Test scripts containing Vercel URLs

## What Was Cleaned
1. **Vercel Directories**: All deployment artifacts removed
2. **Vercel Config Files**: Configuration files deleted
3. **Git Cache**: Vercel files removed from git tracking
4. **GitIgnore**: Updated to prevent future Vercel files

## Your Application Now Uses
- ✅ Docker containerization
- ✅ Docker Compose orchestration
- ✅ Self-hosted deployment on Ubuntu server
- ✅ No external platform dependencies

## To Deploy
Run: \`./deploy-to-ubuntu.sh\` on your Ubuntu server

## Documentation
See: \`UBUNTU_SERVER_DEPLOYMENT.md\` for complete deployment guide

---
Generated on: $(date)
EOF

print_success "Cleanup complete!"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Cleanup Complete!                                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Vercel directories removed"
echo -e "  ${GREEN}✓${NC} Vercel configuration files removed"
echo -e "  ${GREEN}✓${NC} Git cache cleaned"
echo -e "  ${GREEN}✓${NC} .gitignore updated"
echo -e "  ${GREEN}✓${NC} Backup files created"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Review CLEANUP_SUMMARY.md for details"
echo -e "  2. Transfer project to your Ubuntu server"
echo -e "  3. Run ./deploy-to-ubuntu.sh on your server"
echo -e "  4. Follow UBUNTU_SERVER_DEPLOYMENT.md guide"

echo -e "\n${YELLOW}Note:${NC} Original files backed up with .backup extension"
echo -e "${YELLOW}Documentation files preserved for reference${NC}\n"
