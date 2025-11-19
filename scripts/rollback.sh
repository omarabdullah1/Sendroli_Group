#!/bin/bash

# Rollback script for Sendroli Factory Management
# Use this to rollback to previous deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔄 Rollback Script for Sendroli Factory Management"

# Find backup directories
BACKUP_DIRS=$(ls -td sendroli-factory-backup-* 2>/dev/null | head -5)

if [ -z "$BACKUP_DIRS" ]; then
    print_error "No backup directories found!"
    exit 1
fi

echo "Available backups:"
select BACKUP_DIR in $BACKUP_DIRS "Cancel"; do
    case $BACKUP_DIR in
        "Cancel")
            print_warning "Rollback cancelled"
            exit 0
            ;;
        "")
            print_error "Invalid selection"
            ;;
        *)
            break
            ;;
    esac
done

if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Selected backup directory does not exist!"
    exit 1
fi

read -p "Are you sure you want to rollback to $BACKUP_DIR? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Rollback cancelled"
    exit 1
fi

print_status "Starting rollback process..."

# Stop current services
print_status "Stopping current services..."
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml down
fi

# Create backup of current state (before rollback)
if [ -d "sendroli-factory" ]; then
    print_status "Creating backup of current state..."
    cp -r sendroli-factory sendroli-factory-pre-rollback-$(date +%Y%m%d-%H%M%S)
fi

# Restore from backup
print_status "Restoring from backup: $BACKUP_DIR"
rm -rf sendroli-factory
cp -r $BACKUP_DIR sendroli-factory

# Start services
print_status "Starting restored services..."
cd sendroli-factory
docker-compose -f docker-compose.prod.yml up -d

print_status "Waiting for services to start..."
sleep 30

# Health check
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    print_status "Rollback completed successfully!"
    print_status "Services are healthy"
else
    print_error "Rollback completed but health check failed"
    print_warning "Please check the logs: docker-compose -f docker-compose.prod.yml logs"
fi

echo
echo "Rollback Summary:"
echo "- Restored from: $BACKUP_DIR"
echo "- Services status:"
docker-compose -f docker-compose.prod.yml ps