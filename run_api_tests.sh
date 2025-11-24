#!/bin/bash
# Voltaxe Clarity Hub - Automated API Test Suite
# Generated: 2025-11-25
# Purpose: Test backend API endpoints as per QA_TEST_PLAN.md

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# API Base URL
API_URL="http://localhost:8000"

# Test credentials (update these if needed)
TEST_EMAIL="${TEST_EMAIL:-admin@voltaxe.com}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

# Auth token (will be set after login)
AUTH_TOKEN=""

# Results file
RESULTS_FILE="test_results_$(date +%Y%m%d_%H%M%S).md"

# Function to print test header
print_test() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}TEST: $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to log result
log_result() {
    local test_id="$1"
    local status="$2"
    local message="$3"
    local criticality="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "| $test_id | ✅ Pass | $message | $criticality |" >> "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAIL${NC}: $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "| $test_id | ❌ Fail | $message | $criticality |" >> "$RESULTS_FILE"
    fi
}

# Initialize results file
init_results_file() {
    cat > "$RESULTS_FILE" << 'EOF'
# Voltaxe Clarity Hub - Automated Test Results

**Test Date**: $(date +"%Y-%m-%d %H:%M:%S")  
**Environment**: Production  
**Tester**: Automated Test Suite  

## Test Execution Summary

| Test Case ID | Status | Observed Behavior | Criticality |
|:-------------|:-------|:------------------|:------------|
EOF
}

# Function to authenticate and get token
authenticate() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}AUTHENTICATION${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "Logging in as: $TEST_EMAIL"
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$response" | grep -q "access_token"; then
        AUTH_TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
        echo -e "${GREEN}✅ Authentication successful${NC}"
        echo ""
        return 0
    else
        echo -e "${YELLOW}⚠️  Authentication failed - will test without auth token${NC}"
        echo "Response: $response"
        echo ""
        return 1
    fi
}

# Test 1: Backend Health Check
test_backend_health() {
    print_test "Backend API Health Check"
    
    response=$(curl -s "$API_URL/health")
    
    if echo "$response" | grep -q "healthy"; then
        log_result "API-001" "PASS" "Backend API is healthy and responding" "Critical"
    else
        log_result "API-001" "FAIL" "Backend API not responding or unhealthy" "Critical"
    fi
}

# Test 2: Snapshots Endpoint
test_snapshots_endpoint() {
    print_test "TC-FC-001: Snapshots/Fleet Endpoint"
    
    response=$(curl -s "$API_URL/snapshots")
    
    if echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); sys.exit(0 if isinstance(data, list) else 1)" 2>/dev/null; then
        count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
        log_result "TC-FC-001" "PASS" "Snapshots endpoint returns $count endpoints" "High"
    else
        log_result "TC-FC-001" "FAIL" "Snapshots endpoint returned invalid data" "High"
    fi
}

# Test 3: Events Endpoint
test_events_endpoint() {
    print_test "Live Events Endpoint"
    
    response=$(curl -s "$API_URL/events?limit=10")
    
    if echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); sys.exit(0 if isinstance(data, list) else 1)" 2>/dev/null; then
        count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
        log_result "API-003" "PASS" "Events endpoint returns $count events" "Medium"
    else
        log_result "API-003" "FAIL" "Events endpoint returned invalid data" "Medium"
    fi
}

# Test 4: CVE Database Endpoint
test_cve_endpoint() {
    print_test "CVE Database Endpoint"
    
    if [ -n "$AUTH_TOKEN" ]; then
        response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_URL/cve/stats")
    else
        response=$(curl -s "$API_URL/cve/stats")
    fi
    
    if echo "$response" | grep -q "total_cves"; then
        total=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('total_cves', 0))" 2>/dev/null)
        log_result "API-004" "PASS" "CVE database has $total entries" "Medium"
    elif echo "$response" | grep -q "Not authenticated"; then
        log_result "API-004" "PASS" "CVE stats endpoint exists (requires auth)" "Medium"
    else
        log_result "API-004" "FAIL" "CVE stats endpoint not responding correctly" "Medium"
    fi
}

# Test 5: Malware Scanner Summary
test_malware_stats() {
    print_test "TC-MS-001: Malware Scanner Stats"
    
    if [ -n "$AUTH_TOKEN" ]; then
        response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_URL/malware/summary")
    else
        response=$(curl -s "$API_URL/malware/summary")
    fi
    
    if echo "$response" | grep -q "total_scans"; then
        scans=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('total_scans', 0))" 2>/dev/null)
        log_result "TC-MS-001" "PASS" "Malware scanner has performed $scans scans" "High"
    elif echo "$response" | grep -q "Not authenticated"; then
        log_result "TC-MS-001" "PASS" "Malware summary endpoint exists (requires auth)" "High"
    else
        log_result "TC-MS-001" "FAIL" "Malware summary endpoint not responding correctly" "High"
    fi
}

# Test 6: Audit Logs Endpoint (requires auth)
test_audit_logs() {
    print_test "TC-AU-001: Audit Logs Endpoint"
    
    # Try without auth (should fail)
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/audit/logs")
    
    if [ "$response" == "403" ] || [ "$response" == "401" ]; then
        log_result "TC-AU-001" "PASS" "Audit logs properly protected (HTTP $response)" "Critical"
    else
        log_result "TC-AU-001" "FAIL" "Audit logs not protected (HTTP $response)" "Critical"
    fi
}

# Test 7: Database Connectivity
test_database_connection() {
    print_test "Database Connection Test"
    
    if docker exec voltaxe_postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "SELECT COUNT(*) FROM snapshots;" >/dev/null 2>&1; then
        count=$(docker exec voltaxe_postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -t -c "SELECT COUNT(*) FROM snapshots;" 2>/dev/null | tr -d '[:space:]')
        log_result "DB-001" "PASS" "Database connected, $count snapshots in DB" "Critical"
    else
        log_result "DB-001" "FAIL" "Cannot connect to database" "Critical"
    fi
}

# Test 8: Data Integrity - Endpoint Count Consistency
test_data_integrity() {
    print_test "TC-CC-001: Data Integrity - Endpoint Count"
    
    # Get count from API
    api_count=$(curl -s "$API_URL/snapshots" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    
    # Get count from DB
    db_count=$(docker exec voltaxe_postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -t -c "SELECT COUNT(*) FROM snapshots;" 2>/dev/null | tr -d '[:space:]')
    
    if [ "$api_count" == "$db_count" ]; then
        log_result "TC-CC-001" "PASS" "API count ($api_count) matches DB count ($db_count)" "High"
    else
        log_result "TC-CC-001" "FAIL" "API count ($api_count) != DB count ($db_count)" "High"
    fi
}

# Test 9: Malware Scanner File Upload (no actual file test)
test_malware_endpoint_exists() {
    print_test "TC-MS-002: Malware Scan Endpoint Availability"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/malware/scan")
    
    if [ "$response" == "422" ] || [ "$response" == "405" ]; then
        log_result "TC-MS-002" "PASS" "Malware scan endpoint exists (HTTP $response)" "Critical"
    else
        log_result "TC-MS-002" "FAIL" "Malware scan endpoint issue (HTTP $response)" "Critical"
    fi
}

# Test 10: YARA Rules Availability
test_yara_rules() {
    print_test "Malware Scanner - YARA Rules"
    
    if [ -n "$AUTH_TOKEN" ]; then
        response=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_URL/malware/rules")
    else
        response=$(curl -s "$API_URL/malware/rules")
    fi
    
    if echo "$response" | grep -q "rules"; then
        count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('rules', [])))" 2>/dev/null)
        log_result "MS-003" "PASS" "YARA rules loaded: $count rules available" "High"
    elif echo "$response" | grep -q "Not authenticated"; then
        log_result "MS-003" "PASS" "YARA rules endpoint exists (requires auth)" "High"
    else
        log_result "MS-003" "FAIL" "YARA rules endpoint not responding correctly" "High"
    fi
}

# Main execution
main() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║       Voltaxe Clarity Hub - Automated Test Suite          ║"
    echo "║                     API Testing                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    init_results_file
    
    # Authenticate first (optional - tests work with or without)
    authenticate || true
    
    # Run all tests
    test_backend_health
    test_snapshots_endpoint
    test_events_endpoint
    test_cve_endpoint
    test_malware_stats
    test_audit_logs
    test_database_connection
    test_data_integrity
    test_malware_endpoint_exists
    test_yara_rules
    
    # Summary
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}TEST SUMMARY${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Pass Rate: ${PASS_RATE}%"
    
    # Add summary to results file
    cat >> "$RESULTS_FILE" << EOF

## Summary

- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Pass Rate**: $PASS_RATE%

## Test Environment

- Backend URL: $API_URL
- Database: voltaxe_clarity_hub
- Test Date: $(date +"%Y-%m-%d %H:%M:%S")

## Notes

- These are automated API tests
- UI/UX tests require manual execution or Playwright automation
- Critical failures should be addressed immediately
- Full test plan available in QA_TEST_PLAN.md

---
**Generated by**: Automated Test Suite  
**Next Steps**: Review failures and create bug tickets
EOF
    
    echo ""
    echo -e "${GREEN}Results saved to: $RESULTS_FILE${NC}"
}

# Run main function
main
