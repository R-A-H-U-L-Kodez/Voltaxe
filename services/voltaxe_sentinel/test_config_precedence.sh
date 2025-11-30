#!/bin/bash
# Test script to demonstrate agent configuration precedence
# Tests: CLI flags > External config > Embedded config > Hardcoded defaults

set -e

AGENT_BINARY="./voltaxe_sentinel"
TEST_CONFIG="test_agent.conf"

echo "=========================================="
echo "Voltaxe Agent Configuration Precedence Test"
echo "=========================================="
echo ""

# Check if agent binary exists
if [ ! -f "$AGENT_BINARY" ]; then
    echo "❌ Error: Agent binary not found at $AGENT_BINARY"
    echo "Please run: cd services/voltaxe_sentinel && go build -o voltaxe_sentinel"
    exit 1
fi

# Backup existing config if present
if [ -f "agent.conf" ]; then
    echo "📦 Backing up existing agent.conf..."
    mv agent.conf agent.conf.test_backup
fi

echo ""
echo "TEST 1: Embedded Configuration (No External Config)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Uses embedded default configuration"
echo ""
timeout 2 $AGENT_BINARY 2>&1 | grep -A 5 "CONFIG" || true
echo ""

echo ""
echo "TEST 2: External Configuration Override"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Uses external config file (overrides embedded)"
echo ""
cat > $TEST_CONFIG <<EOF
API_SERVER=https://external-config-server.com
HEARTBEAT_INTERVAL=45s
SCAN_INTERVAL=120s
TLS_SKIP_VERIFY=true
PROCESS_MONITORING=true
VULNERABILITY_SCANNING=false
BEHAVIORAL_ANALYSIS=true
EOF
echo "Created test config:"
cat $TEST_CONFIG
echo ""
timeout 2 $AGENT_BINARY -config $TEST_CONFIG 2>&1 | grep -A 5 "CONFIG" || true
echo ""

echo ""
echo "TEST 3: CLI Flag Override"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected: Uses CLI flag (overrides both external and embedded)"
echo ""
timeout 2 $AGENT_BINARY -config $TEST_CONFIG -server https://cli-override-server.com 2>&1 | grep -A 5 "CONFIG" || true
echo ""

# Cleanup
echo ""
echo "🧹 Cleanup..."
rm -f $TEST_CONFIG

# Restore backup if it exists
if [ -f "agent.conf.test_backup" ]; then
    echo "📦 Restoring original agent.conf..."
    mv agent.conf.test_backup agent.conf
fi

echo ""
echo "=========================================="
echo "✅ Configuration Precedence Test Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Level 1 (Highest): CLI Flags (-server)"
echo "  Level 2: External Config (agent.conf)"
echo "  Level 3: Embedded Config (default_agent.conf)"
echo "  Level 4 (Lowest): Hardcoded Defaults"
echo ""
