#!/bin/bash

# Test Command Polling End-to-End
# This script verifies the two-way communication system works correctly

set -e

echo "=========================================="
echo "🧪 TESTING COMMAND POLLING SYSTEM"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${VOLTAXE_API_URL:-http://localhost:8080}"
HOSTNAME=$(hostname)

echo "📋 Configuration:"
echo "   API URL: $API_URL"
echo "   Hostname: $HOSTNAME"
echo ""

# Test 1: Check API Server
echo "🔍 Test 1: Checking API server connectivity..."
if curl -s -f "$API_URL/telemetry" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is reachable${NC}"
else
    echo -e "${RED}❌ API server is NOT reachable at $API_URL${NC}"
    echo "   Please start the API server: docker-compose up -d clarity-hub-api"
    exit 1
fi
echo ""

# Test 2: Check PostgreSQL
echo "🔍 Test 2: Checking database..."
if docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is operational${NC}"
else
    echo -e "${RED}❌ PostgreSQL is NOT accessible${NC}"
    echo "   Please start PostgreSQL: docker-compose up -d postgres"
    exit 1
fi
echo ""

# Test 3: Queue a test command
echo "🔍 Test 3: Queueing test isolation command..."
RESPONSE=$(curl -s -X POST "$API_URL/api/isolate" \
    -H "Content-Type: application/json" \
    -d "{\"hostname\":\"$HOSTNAME\", \"username\":\"test-user\"}")

if echo "$RESPONSE" | grep -q "queued\|isolated"; then
    echo -e "${GREEN}✅ Command queued successfully${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${YELLOW}⚠️  Unexpected response: $RESPONSE${NC}"
fi
echo ""

# Test 4: Check command in database
echo "🔍 Test 4: Verifying command in database..."
PENDING_COUNT=$(docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
    -t -c "SELECT COUNT(*) FROM pending_commands WHERE hostname='$HOSTNAME' AND status='pending';" | tr -d ' ')

if [ "$PENDING_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $PENDING_COUNT pending command(s) in database${NC}"
    docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
        -c "SELECT id, command, status, created_at FROM pending_commands WHERE hostname='$HOSTNAME' ORDER BY id DESC LIMIT 3;"
else
    echo -e "${YELLOW}⚠️  No pending commands found (may have been executed already)${NC}"
fi
echo ""

# Test 5: Test polling endpoint
echo "🔍 Test 5: Testing /command/poll endpoint..."
POLL_RESPONSE=$(curl -s "$API_URL/command/poll?host=$HOSTNAME")
COMMAND_COUNT=$(echo "$POLL_RESPONSE" | jq '.commands | length' 2>/dev/null || echo "0")

if [ "$COMMAND_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Poll returned $COMMAND_COUNT command(s)${NC}"
    echo "$POLL_RESPONSE" | jq '.'
else
    echo -e "${YELLOW}⚠️  No commands returned (this is OK if agent already polled)${NC}"
fi
echo ""

# Test 6: Check agent polling
echo "🔍 Test 6: Checking if agent is polling..."
if pgrep -f voltaxe_sentinel > /dev/null; then
    echo -e "${GREEN}✅ Agent is running (PID: $(pgrep -f voltaxe_sentinel))${NC}"
    
    # Check if agent logs show polling
    if [ -f /home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log ]; then
        RECENT_POLLS=$(tail -100 /home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log | grep -c "COMMAND POLL" || echo "0")
        if [ "$RECENT_POLLS" -gt 0 ]; then
            echo -e "${GREEN}✅ Agent is actively polling ($RECENT_POLLS recent poll entries)${NC}"
            echo ""
            echo "Recent polling activity:"
            tail -100 /home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log | grep "COMMAND POLL" | tail -5
        else
            echo -e "${YELLOW}⚠️  No recent polling activity in logs${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Agent is NOT running${NC}"
    echo "   To start the agent:"
    echo "   cd /home/rahul/Voltaxe/services/voltaxe_sentinel"
    echo "   ./voltaxe_sentinel -api $API_URL"
fi
echo ""

# Test 7: Full cycle test
echo "🔍 Test 7: Full cycle test (if agent running)..."
if pgrep -f voltaxe_sentinel > /dev/null; then
    echo "   Queueing new isolation command..."
    curl -s -X POST "$API_URL/api/isolate" \
        -H "Content-Type: application/json" \
        -d "{\"hostname\":\"$HOSTNAME\", \"username\":\"test-cycle\"}" > /dev/null
    
    echo "   Waiting 15 seconds for agent to poll and execute..."
    for i in {15..1}; do
        echo -n "   $i..."
        sleep 1
    done
    echo " done!"
    
    # Check if command was executed
    EXECUTED_COUNT=$(docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
        -t -c "SELECT COUNT(*) FROM pending_commands WHERE hostname='$HOSTNAME' AND status='executed' AND created_by='test-cycle';" | tr -d ' ')
    
    if [ "$EXECUTED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Command was executed successfully!${NC}"
        docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
            -c "SELECT id, command, status, created_at, executed_at, result FROM pending_commands WHERE hostname='$HOSTNAME' AND created_by='test-cycle' ORDER BY id DESC LIMIT 1;"
    else
        echo -e "${YELLOW}⚠️  Command not yet executed (check agent logs for errors)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping (agent not running)${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo ""

# Count total commands
TOTAL_COMMANDS=$(docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
    -t -c "SELECT COUNT(*) FROM pending_commands WHERE hostname='$HOSTNAME';" | tr -d ' ')
EXECUTED_COMMANDS=$(docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
    -t -c "SELECT COUNT(*) FROM pending_commands WHERE hostname='$HOSTNAME' AND status='executed';" | tr -d ' ')
PENDING_COMMANDS=$(docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
    -t -c "SELECT COUNT(*) FROM pending_commands WHERE hostname='$HOSTNAME' AND status='pending';" | tr -d ' ')

echo "Commands for $HOSTNAME:"
echo "   Total: $TOTAL_COMMANDS"
echo "   Executed: $EXECUTED_COMMANDS"
echo "   Pending: $PENDING_COMMANDS"
echo ""

if [ "$EXECUTED_COMMANDS" -gt 0 ]; then
    echo -e "${GREEN}✅ TWO-WAY COMMUNICATION IS WORKING!${NC}"
    echo ""
    echo "Recent executed commands:"
    docker exec clarity-hub-api psql -U voltaxe -d voltaxe_clarity \
        -c "SELECT id, command, created_at, executed_at, result->>'message' as message FROM pending_commands WHERE hostname='$HOSTNAME' AND status='executed' ORDER BY id DESC LIMIT 5;"
else
    echo -e "${YELLOW}⚠️  No executed commands yet${NC}"
    echo ""
    echo "Possible reasons:"
    echo "   1. Agent not running (start with: ./voltaxe_sentinel -api $API_URL)"
    echo "   2. Agent polling interval not elapsed (wait 10 seconds)"
    echo "   3. Network connectivity issues (check docker network)"
fi

echo ""
echo "=========================================="
echo "To monitor live polling:"
echo "   tail -f /home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log | grep 'COMMAND POLL'"
echo ""
echo "To manually trigger isolation:"
echo "   curl -X POST $API_URL/api/isolate -H 'Content-Type: application/json' -d '{\"hostname\":\"$HOSTNAME\", \"username\":\"manual\"}'"
echo "=========================================="
