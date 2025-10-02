#!/bin/bash

# Voltaxe Clarity Hub - Database Backup Script
# Creates secure backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/var/backups/voltaxe"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="voltaxe_clarity_hub_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Load environment
source .env 2>/dev/null || echo "Warning: .env file not found"

echo "🔒 Starting Voltaxe database backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database dump
docker-compose exec -T postgres pg_dump \
    -U voltaxe_admin \
    -d voltaxe_clarity_hub \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    > "$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"

# Clean old backups
echo "🧹 Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "voltaxe_clarity_hub_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "🎉 Database backup completed successfully!"