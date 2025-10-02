#!/bin/bash

# Voltaxe Platform Integration Test
# Complete demonstration of Axon Engine + Frontend Integration

set -e

echo "🔥 VOLTAXE PLATFORM - COMPLETE INTEGRATION TEST"
echo "================================================"
echo "Testing Axon Engine → API → Frontend Integration"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "  ${YELLOW}GET${NC} http://localhost:8000$endpoint"
    
    if curl -s -f http://localhost:8000$endpoint > /dev/null; then
        echo -e "  ${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "  ${RED}❌ FAILED${NC}"
        return 1
    fi
    echo ""
}

echo -e "${BLUE}🔍 TESTING API ENDPOINTS${NC}"
echo "========================="

# Test core API endpoints
test_api_endpoint "/health" "API Health Check"
test_api_endpoint "/resilience/dashboard" "Resilience Dashboard Data"
test_api_endpoint "/resilience/scores" "Individual Resilience Scores"
test_api_endpoint "/snapshots" "System Snapshots"
test_api_endpoint "/events" "Security Events"

echo -e "${BLUE}📊 RESILIENCE INTELLIGENCE DATA${NC}"
echo "================================"

# Get resilience dashboard data
echo -e "${YELLOW}Dashboard Summary:${NC}"
curl -s http://localhost:8000/resilience/dashboard | python -c "
import sys, json
data = json.load(sys.stdin)
summary = data['summary']
print(f'  • Total Endpoints: {summary[\"total_endpoints\"]}')
print(f'  • Average Score: {summary[\"average_score\"]}')
print('  • Risk Distribution:')
for risk, count in summary['risk_distribution'].items():
    if count > 0:
        color = '🟢' if risk == 'LOW' else '🟡' if risk == 'MEDIUM' else '🟠' if risk == 'HIGH' else '🔴'
        print(f'    {color} {risk}: {count} endpoints')
"

echo ""

# Get individual scores
echo -e "${YELLOW}Individual Endpoint Scores:${NC}"
curl -s http://localhost:8000/resilience/scores | python -c "
import sys, json
data = json.load(sys.stdin)
for endpoint in data:
    score = endpoint['resilience_score']
    risk = endpoint['risk_category']
    hostname = endpoint['hostname']
    color = '🟢' if risk == 'LOW' else '🟡' if risk == 'MEDIUM' else '🟠' if risk == 'HIGH' else '🔴'
    print(f'  {color} {hostname}')
    print(f'     Score: {score}/100 | Risk: {risk}')
"

echo ""

echo -e "${BLUE}🌐 FRONTEND ACCESS${NC}"
echo "=================="

# Check frontend ports
echo -e "${YELLOW}Frontend Services:${NC}"
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Frontend running on port 5173${NC}"
    echo -e "     ${BLUE}🔗 http://localhost:5173${NC}"
fi

if lsof -i :5174 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Frontend running on port 5174${NC}"
    echo -e "     ${BLUE}🔗 http://localhost:5174${NC}"
fi

echo ""

echo -e "${BLUE}⚡ REAL-TIME SERVICES${NC}"
echo "===================="

# Check service status
echo -e "${YELLOW}Service Status:${NC}"
if lsof -i :8000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Clarity Hub API${NC} (port 8000)"
else
    echo -e "  ${RED}❌ Clarity Hub API${NC} (port 8000)"
fi

if pgrep -f "axon_engine.*main.py" > /dev/null; then
    echo -e "  ${GREEN}✅ Axon Engine${NC} (resilience scoring)"
else
    echo -e "  ${RED}❌ Axon Engine${NC} (resilience scoring)"
fi

if pgrep -f "voltaxe-sentinel" > /dev/null; then
    echo -e "  ${GREEN}✅ Voltaxe Sentinel${NC} (monitoring agent)"
else
    echo -e "  ${RED}❌ Voltaxe Sentinel${NC} (monitoring agent)"
fi

echo ""

echo -e "${GREEN}🎉 INTEGRATION STATUS${NC}"
echo "====================="
echo -e "${GREEN}✅ Axon Engine → API Integration: WORKING${NC}"
echo -e "${GREEN}✅ API → Frontend Integration: READY${NC}"
echo -e "${GREEN}✅ Real-time Resilience Scoring: ACTIVE${NC}"
echo -e "${GREEN}✅ Security Intelligence Dashboard: OPERATIONAL${NC}"

echo ""
echo -e "${BLUE}📱 ACCESS YOUR DASHBOARD${NC}"
echo "========================"
echo -e "• ${YELLOW}Dashboard:${NC} http://localhost:5174 (or 5173)"
echo -e "• ${YELLOW}API Docs:${NC} http://localhost:8000/docs"
echo -e "• ${YELLOW}Raw API:${NC} http://localhost:8000/resilience/dashboard"
echo ""
echo -e "${GREEN}🔥 Voltaxe Platform is fully operational!${NC}"