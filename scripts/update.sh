#!/bin/bash

# Voltaxe Clarity Hub - Update Script
# Safely updates the platform with zero-downtime deployment

set -e

echo "🔄 Voltaxe Clarity Hub Update Process"
echo "==================================="

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Create backup before update
echo "🔒 Creating backup before update..."
./scripts/backup_database.sh

# Perform rolling update
echo "🔄 Performing rolling update..."

# Update API service (with health checks)
echo "Updating API service..."
docker-compose up -d --no-deps api
sleep 10

# Wait for API to be healthy
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API service updated successfully"
        break
    fi
    echo "Waiting for API service to be ready... ($i/30)"
    sleep 2
done

# Update frontend service
echo "Updating Frontend service..."
docker-compose up -d --no-deps frontend
sleep 10

# Update other services
echo "Updating supporting services..."
docker-compose up -d --no-deps nginx redis cve_sync

# Final health check
echo "🔍 Running post-update health check..."
./scripts/health_check.sh

echo "🎉 Update completed successfully!"