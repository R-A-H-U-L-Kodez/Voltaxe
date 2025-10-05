#!/bin/bash
# CVE Database Setup and Test Script
# Voltaxe Clarity Hub

set -e

echo "============================================"
echo "CVE Database Setup & Test"
echo "Voltaxe Clarity Hub"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Please copy .env.example to .env and configure it:"
    echo "   cp .env.example .env"
    echo "   nano .env  # Edit and add your NVD_API_KEY"
    exit 1
fi

# Source .env
source .env

# Check NVD API Key
if [ -z "$NVD_API_KEY" ] || [ "$NVD_API_KEY" == "your-nvd-api-key-here" ]; then
    echo "⚠️  Warning: NVD_API_KEY not configured"
    echo "📋 Get your free API key:"
    echo "   1. Visit: https://nvd.nist.gov/developers/request-an-api-key"
    echo "   2. Fill out the form"
    echo "   3. Check your email"
    echo "   4. Add to .env: NVD_API_KEY=your-key-here"
    echo ""
    echo "ℹ️  Continuing without API key (slower sync)..."
    echo ""
fi

echo "Step 1: Checking Docker containers..."
echo "--------------------------------------------"
docker-compose ps

echo ""
echo "Step 2: Starting CVE Sync Service..."
echo "--------------------------------------------"
docker-compose up -d cve_sync

echo ""
echo "Step 3: Waiting for initial sync (this may take 5-10 minutes)..."
echo "--------------------------------------------"
echo "💡 Tip: Open another terminal and run:"
echo "   docker-compose logs -f cve_sync"
echo ""
sleep 5

# Wait for first batch of CVEs
echo "Waiting 30 seconds for first batch..."
sleep 30

echo ""
echo "Step 4: Checking database..."
echo "--------------------------------------------"

# Get CVE count from database
CVE_COUNT=$(docker-compose exec -T postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -t -c "SELECT COUNT(*) FROM cve_database WHERE is_active = true;")
CVE_COUNT=$(echo $CVE_COUNT | xargs)

echo "✅ CVEs in database: $CVE_COUNT"

if [ "$CVE_COUNT" -gt "0" ]; then
    echo ""
    echo "Step 5: CVE Breakdown by Severity..."
    echo "--------------------------------------------"
    docker-compose exec -T postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "
        SELECT 
            severity, 
            COUNT(*) as count,
            ROUND(AVG(cvss_v3_score), 2) as avg_cvss
        FROM cve_database 
        WHERE is_active = true AND severity IS NOT NULL
        GROUP BY severity 
        ORDER BY 
            CASE severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
                ELSE 5
            END;
    "
    
    echo ""
    echo "Step 6: Sample CVEs..."
    echo "--------------------------------------------"
    docker-compose exec -T postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "
        SELECT 
            cve_id,
            severity,
            cvss_v3_score as cvss,
            LEFT(description, 80) as description
        FROM cve_database 
        WHERE is_active = true AND cvss_v3_score IS NOT NULL
        ORDER BY cvss_v3_score DESC
        LIMIT 5;
    "
    
    echo ""
    echo "Step 7: Testing API Endpoints..."
    echo "--------------------------------------------"
    
    # Get a sample CVE ID
    SAMPLE_CVE=$(docker-compose exec -T postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -t -c "SELECT cve_id FROM cve_database WHERE is_active = true AND cvss_v3_score > 7.0 ORDER BY published_date DESC LIMIT 1;")
    SAMPLE_CVE=$(echo $SAMPLE_CVE | xargs)
    
    if [ ! -z "$SAMPLE_CVE" ]; then
        echo "Testing with CVE: $SAMPLE_CVE"
        echo ""
        
        # First, get auth token
        echo "1. Authenticating..."
        AUTH_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@voltaxe.com","password":"password"}')
        
        ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        
        if [ ! -z "$ACCESS_TOKEN" ]; then
            echo "   ✅ Authenticated"
            echo ""
            
            echo "2. Testing GET /vulnerabilities/$SAMPLE_CVE"
            curl -s -X GET "http://localhost:8000/vulnerabilities/$SAMPLE_CVE" \
                -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
            echo ""
            
            echo "3. Testing GET /vulnerabilities/stats/summary"
            curl -s -X GET "http://localhost:8000/vulnerabilities/stats/summary" \
                -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
            echo ""
            
            echo "4. Testing GET /vulnerabilities/search?severity=CRITICAL&limit=5"
            curl -s -X GET "http://localhost:8000/vulnerabilities/search?severity=CRITICAL&limit=5" \
                -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.results | length'
            echo ""
            
            echo "5. Testing GET /vulnerabilities/recent?days=7"
            curl -s -X GET "http://localhost:8000/vulnerabilities/recent?days=7" \
                -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.count'
            echo ""
        else
            echo "   ❌ Authentication failed"
        fi
    fi
    
    echo ""
    echo "============================================"
    echo "✅ CVE Database Setup Complete!"
    echo "============================================"
    echo ""
    echo "📊 Database Stats:"
    echo "   - Total CVEs: $CVE_COUNT"
    echo "   - Sync Status: Active"
    echo "   - Next Sync: 24 hours"
    echo ""
    echo "🔗 Available Endpoints:"
    echo "   GET  /vulnerabilities/{cve_id}      - Get CVE details"
    echo "   GET  /vulnerabilities/stats/summary - Database statistics"
    echo "   GET  /vulnerabilities/search        - Search CVEs"
    echo "   GET  /vulnerabilities/recent        - Recent CVEs"
    echo ""
    echo "📝 View logs:"
    echo "   docker-compose logs -f cve_sync"
    echo ""
    echo "🔄 Manual sync trigger:"
    echo "   docker-compose restart cve_sync"
    echo ""
    
else
    echo ""
    echo "⏳ Sync still in progress..."
    echo ""
    echo "The first sync can take 10-15 minutes depending on:"
    echo "  - NVD API rate limits"
    echo "  - Network speed"
    echo "  - Number of CVEs to fetch"
    echo ""
    echo "Check progress:"
    echo "  docker-compose logs -f cve_sync"
    echo ""
    echo "Re-run this script when sync completes:"
    echo "  ./scripts/test_cve_database.sh"
    echo ""
fi
