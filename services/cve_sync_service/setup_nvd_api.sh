#!/bin/bash

# Voltaxe CVE Sync Service - Setup Script
# This script helps configure the NIST NVD API integration

set -e

echo "🛡️  Voltaxe CVE Sync Service Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
ENV_FILE="$(dirname "$0")/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found at $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📋 NIST NVD API Key Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To get enhanced CVE synchronization performance, you can configure"
echo "a free NIST NVD API key which increases rate limits from:"
echo ""
echo "  📈 Public:        5 requests per 30 seconds"
echo "  🚀 Authenticated: 50 requests per 30 seconds"
echo ""
echo -e "${YELLOW}📝 To get your free API key:${NC}"
echo "  1. Visit: https://nvd.nist.gov/developers/request-an-api-key"
echo "  2. Fill out the form with your information"
echo "  3. You'll receive the API key via email (usually within minutes)"
echo ""

# Prompt for API key
read -p "🔑 Enter your NIST NVD API key (or press Enter to skip): " api_key

if [ -n "$api_key" ]; then
    # Update the .env file
    if grep -q "^NVD_API_KEY=" "$ENV_FILE"; then
        # Replace existing key
        sed -i "s/^NVD_API_KEY=.*/NVD_API_KEY=$api_key/" "$ENV_FILE"
    else
        # Add new key
        echo "NVD_API_KEY=$api_key" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ API key configured successfully${NC}"
    echo -e "${GREEN}🚀 CVE sync will now use authenticated rate limits${NC}"
else
    echo -e "${YELLOW}⚠️  No API key provided${NC}"
    echo -e "${YELLOW}🐌 CVE sync will use slower public rate limits${NC}"
fi

echo ""
echo -e "${GREEN}📊 Current Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Show current config
if [ -n "$api_key" ]; then
    echo "🔑 API Key: ***${api_key: -4} (configured)"
    echo "⚡ Rate Limit: 50 requests per 30 seconds"
else
    echo "🔑 API Key: Not configured"
    echo "⚡ Rate Limit: 5 requests per 30 seconds"
fi

# Read other config values
SYNC_INTERVAL=$(grep "^SYNC_INTERVAL_HOURS=" "$ENV_FILE" | cut -d'=' -f2)
DATABASE_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2)

echo "🔄 Sync Interval: ${SYNC_INTERVAL:-6} hours"
echo "💾 Database: ${DATABASE_URL:-sqlite:///./voltaxe_cve.db}"
echo ""

echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Start the CVE sync service:"
echo "   cd $(dirname "$0") && source venv/bin/activate && python main.py"
echo ""
echo "2. Monitor sync progress:"
echo "   tail -f $(dirname "$0")/cve_sync.log"
echo ""
echo "3. Check API endpoint:"
echo "   curl http://localhost:8000/vulnerabilities/CVE-2024-12345"
echo ""
echo -e "${GREEN}🚀 CVE Sync Service is ready to run!${NC}"