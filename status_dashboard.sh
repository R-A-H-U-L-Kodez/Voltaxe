#!/bin/bash

# Voltaxe System Status Dashboard
# Comprehensive status check for all Voltaxe services

echo "🛡️  VOLTAXE CLARITY HUB - SYSTEM STATUS"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check service status
check_service() {
    local service_name=$1
    local check_command=$2
    local description=$3
    
    printf "%-20s " "$service_name:"
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC} - $description"
        return 0
    else
        echo -e "${RED}❌ Stopped${NC} - $description"
        return 1
    fi
}

# Check port availability
check_port() {
    local port=$1
    local service=$2
    
    printf "%-20s " "$service:"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port${NC} - Active"
    else
        echo -e "${RED}❌ Port $port${NC} - Not listening"
    fi
}

# Core Services
echo -e "${BLUE}🔧 CORE SERVICES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service "Backend API" "curl -s -f http://localhost:8000/health" "FastAPI + Authentication"
check_service "Frontend UI" "curl -s -f http://localhost:5173" "React Dashboard"

echo ""

# Monitoring Services
echo -e "${BLUE}👁️  MONITORING SERVICES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service "Voltaxe Sentinel" "pgrep -f voltaxe_sentinel" "Go-based System Monitor"
check_service "CVE Sync Service" "pgrep -f 'python.*cve_sync_service'" "NIST NVD Integration"

echo ""

# Port Status
echo -e "${BLUE}🌐 NETWORK STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_port 8000 "API Server"
check_port 5173 "Frontend Server"

echo ""

# Data Status
echo -e "${BLUE}📊 DATA STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check snapshots
SNAPSHOT_COUNT=$(curl -s "http://localhost:8000/snapshots" 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
printf "%-20s " "System Snapshots:"
if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $SNAPSHOT_COUNT endpoints${NC} - Active monitoring"
else
    echo -e "${YELLOW}⚠️  No data${NC} - Start agents to collect data"
fi

# Check events
EVENT_COUNT=$(curl -s "http://localhost:8000/events" 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
printf "%-20s " "Security Events:"
if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $EVENT_COUNT events${NC} - Real-time monitoring active"
else
    echo -e "${YELLOW}⚠️  No events${NC} - Monitoring agents needed"
fi

# Check alerts
ALERT_COUNT=$(curl -s "http://localhost:8000/alerts" 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
printf "%-20s " "Security Alerts:"
if [ "$ALERT_COUNT" -gt 0 ]; then
    echo -e "${RED}🚨 $ALERT_COUNT alerts${NC} - Threats detected"
else
    echo -e "${GREEN}✅ No alerts${NC} - System secure"
fi

echo ""

# Deployment Status
echo -e "${BLUE}🚀 DEPLOYMENT STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

printf "%-20s " "Agent Binaries:"
if [ -f "voltaxe_agent_deployment.tar.gz" ]; then
    echo -e "${GREEN}✅ Ready${NC} - Cross-platform deployment package"
else
    echo -e "${YELLOW}⚠️  Not built${NC} - Run ./deploy_agents.sh"
fi

printf "%-20s " "Documentation:"
if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    echo -e "${GREEN}✅ Available${NC} - Agent deployment guide ready"
else
    echo -e "${YELLOW}⚠️  Missing${NC} - Generate deployment docs"
fi

echo ""

# Configuration Status
echo -e "${BLUE}⚙️  CONFIGURATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Supabase config
if [ -f "services/clarity_hub_api/.env" ] && grep -q "SUPABASE_URL=https://" "services/clarity_hub_api/.env"; then
    echo -e "Supabase Auth:      ${GREEN}✅ Configured${NC} - Production authentication enabled"
else
    echo -e "Supabase Auth:      ${YELLOW}⚠️  Fallback mode${NC} - Configure for production"
fi

# Check NIST API config
if [ -f "services/cve_sync_service/.env" ] && grep -q "NVD_API_KEY=.*[^[:space:]]" "services/cve_sync_service/.env"; then
    echo -e "NIST NVD API:       ${GREEN}✅ Configured${NC} - Fast CVE synchronization (50 req/30s)"
else
    echo -e "NIST NVD API:       ${YELLOW}⚠️  Public limits${NC} - Get API key for better performance (5 req/30s)"
fi

echo ""

# Access Information
echo -e "${BLUE}🌐 ACCESS INFORMATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "Web Dashboard:      ${GREEN}http://localhost:5173${NC}"
echo -e "API Documentation:  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "Health Check:       ${GREEN}http://localhost:8000/health${NC}"
echo ""
echo -e "Default Login:      ${YELLOW}admin@voltaxe.com / password${NC}"

echo ""

# Quick Actions
echo -e "${BLUE}🎯 QUICK ACTIONS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Configure NIST API:  cd services/cve_sync_service && ./setup_nvd_api.sh"
echo "Deploy Agents:       ./deploy_agents.sh"
echo "Stop All Services:   ./scripts/stop_services.sh"
echo "View Logs:           tail -f services/*/logs/*.log"

echo ""
echo -e "${GREEN}🎉 Voltaxe Clarity Hub Status Dashboard Complete!${NC}"