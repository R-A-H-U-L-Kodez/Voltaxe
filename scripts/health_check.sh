#!/bin/bash

# Voltaxe Clarity Hub - Health Check Script
# Monitors all services and sends alerts if issues detected

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Health check results
OVERALL_HEALTHY=true

check_service() {
    local service_name=$1
    local health_command=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    if eval "$health_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        OVERALL_HEALTHY=false
        return 1
    fi
}

echo "🔍 Voltaxe Clarity Hub Health Check"
echo "=================================="

# Check Docker services
check_service "postgres" "docker-compose exec postgres pg_isready -U voltaxe_admin -d voltaxe_clarity_hub" "PostgreSQL Database"
check_service "api" "curl -f http://localhost:8000/health" "FastAPI Backend"
check_service "frontend" "curl -f http://localhost:3000" "React Frontend"
check_service "nginx" "curl -f http://localhost:80" "Nginx Proxy"
check_service "redis" "docker-compose exec redis redis-cli ping | grep -q PONG" "Redis Cache"

# Check CVE sync service
if docker-compose ps cve_sync | grep -q "Up"; then
    echo -e "CVE Sync Service... ${GREEN}✅ Running${NC}"
else
    echo -e "CVE Sync Service... ${YELLOW}⚠️ Stopped${NC}"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "Disk Space (${DISK_USAGE}%)... ${GREEN}✅ OK${NC}"
else
    echo -e "Disk Space (${DISK_USAGE}%)... ${RED}❌ High Usage${NC}"
    OVERALL_HEALTHY=false
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 85 ]; then
    echo -e "Memory Usage (${MEMORY_USAGE}%)... ${GREEN}✅ OK${NC}"
else
    echo -e "Memory Usage (${MEMORY_USAGE}%)... ${YELLOW}⚠️ High${NC}"
fi

echo ""

if [ "$OVERALL_HEALTHY" = true ]; then
    echo -e "${GREEN}🎉 All systems healthy!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some systems need attention!${NC}"
    exit 1
fi