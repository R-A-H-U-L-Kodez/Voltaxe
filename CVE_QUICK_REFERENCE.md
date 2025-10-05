# 🛡️ CVE Database Quick Reference

## 🚀 Quick Start (30 seconds)

```bash
# 1. Get NVD API key (optional but recommended)
# Visit: https://nvd.nist.gov/developers/request-an-api-key

# 2. Add to .env
echo "NVD_API_KEY=your-key-here" >> .env

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose logs -f cve_sync
```

## 📡 API Endpoints

### Get CVE Details
```bash
GET /vulnerabilities/{cve_id}
Authorization: Bearer <token>

Example: /vulnerabilities/CVE-2024-12345
```

### Database Statistics
```bash
GET /vulnerabilities/stats/summary
Authorization: Bearer <token>

Response:
{
  "total_cves": 96420,
  "severity_breakdown": {
    "critical": 12450,
    "high": 34280,
    "medium": 41230,
    "low": 8460
  },
  "recent_cves_30_days": 4520,
  "last_sync": "2024-10-05T14:30:00Z"
}
```

### Search CVEs
```bash
GET /vulnerabilities/search?severity=CRITICAL&min_cvss=9.0&limit=10
Authorization: Bearer <token>

Query Parameters:
  - query:     Search CVE ID or description
  - severity:  CRITICAL, HIGH, MEDIUM, LOW
  - min_cvss:  Minimum CVSS score (0.0-10.0)
  - max_cvss:  Maximum CVSS score
  - limit:     Results per page (max 500)
  - offset:    Pagination offset
```

### Recent CVEs
```bash
GET /vulnerabilities/recent?days=7&severity=HIGH
Authorization: Bearer <token>

Query Parameters:
  - days:      Days to look back (default 7)
  - severity:  Filter by severity
  - limit:     Max results (default 100)
```

## 🔧 Common Tasks

### Check Sync Status
```bash
docker-compose logs --tail=50 cve_sync
```

### Get CVE Count
```bash
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "SELECT COUNT(*) FROM cve_database WHERE is_active = true;"
```

### Severity Breakdown
```bash
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "SELECT severity, COUNT(*) FROM cve_database GROUP BY severity ORDER BY COUNT(*) DESC;"
```

### Recent High Severity CVEs
```bash
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "SELECT cve_id, cvss_v3_score, severity, LEFT(description, 100) 
      FROM cve_database 
      WHERE severity IN ('CRITICAL', 'HIGH') 
      ORDER BY published_date DESC LIMIT 10;"
```

### Manual Sync Trigger
```bash
docker-compose restart cve_sync
docker-compose logs -f cve_sync
```

### Test Script
```bash
./scripts/test_cve_database.sh
```

## 🔍 API Testing

### Get Authentication Token
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voltaxe.com","password":"password"}' \
  | jq -r '.access_token')
```

### Test CVE Lookup
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/vulnerabilities/CVE-2024-12345 | jq '.'
```

### Test Stats Endpoint
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/vulnerabilities/stats/summary | jq '.'
```

### Test Search
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/search?severity=CRITICAL&limit=5" | jq '.results | length'
```

### Test Recent
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/recent?days=7" | jq '.count'
```

## 📊 Performance

| Operation | With API Key | Without API Key |
|-----------|--------------|-----------------|
| Sync Speed | 6,000 CVEs/min | 600 CVEs/min |
| Full Sync (120 days) | 10-15 min | 1-2 hours |
| Daily Incremental | 1-2 min | 5-10 min |
| Query Response | <100ms | <100ms |

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs cve_sync

# Verify database
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "SELECT 1;"

# Restart
docker-compose restart cve_sync
```

### No CVEs Syncing
```bash
# Check NVD API connectivity
curl -I https://services.nvd.nist.gov/rest/json/cves/2.0

# View detailed logs
docker-compose logs --tail=100 -f cve_sync

# Verify .env configuration
grep NVD_API_KEY .env
```

### Rate Limit Errors (429)
```bash
# Add API key to .env
echo "NVD_API_KEY=your-key-here" >> .env

# Restart service
docker-compose restart cve_sync
```

### Slow Queries
```bash
# Reindex database
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "REINDEX TABLE cve_database;"

# Vacuum database
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "VACUUM ANALYZE cve_database;"
```

## ⚙️ Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://voltaxe_admin:pass@postgres:5432/voltaxe_clarity_hub

# Optional (but recommended)
NVD_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional
SYNC_INTERVAL_HOURS=24    # Default: 24 hours
DAYS_BACK=120             # Default: 120 days
```

### Get NVD API Key
1. Visit: https://nvd.nist.gov/developers/request-an-api-key
2. Fill form with email
3. Check email for key
4. Add to `.env`

### Benefits of API Key
- ✅ 10x faster sync (50 req/30s vs 5 req/30s)
- ✅ Priority access during high traffic
- ✅ Full database sync in 10-15 minutes

## 📈 Database Schema

```sql
CREATE TABLE cve_database (
    id                   SERIAL PRIMARY KEY,
    cve_id               VARCHAR UNIQUE NOT NULL,
    description          TEXT,
    cvss_v3_score        FLOAT,
    cvss_v3_vector       VARCHAR,
    cvss_v2_score        FLOAT,
    cvss_v2_vector       VARCHAR,
    severity             VARCHAR,            -- CRITICAL, HIGH, MEDIUM, LOW
    attack_vector        VARCHAR,            -- NETWORK, ADJACENT, LOCAL, PHYSICAL
    published_date       TIMESTAMP,
    last_modified        TIMESTAMP,
    references           JSON,               -- URLs to advisories
    cpe_configurations   JSON,               -- Affected products (CPE format)
    affected_products    JSON,               -- Parsed product names
    exploitability_score FLOAT,
    impact_score         FLOAT,
    weaknesses           JSON,               -- CWE classifications
    vendor_comments      JSON,
    is_active            BOOLEAN DEFAULT TRUE,
    sync_timestamp       TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Use Cases

### 1. Vulnerability Assessment
```bash
# Find all critical CVEs in last 30 days
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/recent?days=30&severity=CRITICAL"
```

### 2. Compliance Reporting
```bash
# Get vulnerability stats for report
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/stats/summary"
```

### 3. Threat Intelligence
```bash
# Search for specific product vulnerabilities
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/search?query=apache&severity=HIGH"
```

### 4. Incident Response
```bash
# Get details for specific CVE in alert
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/vulnerabilities/CVE-2024-12345"
```

## 📚 Resources

- **NIST NVD**: https://nvd.nist.gov
- **API Docs**: https://nvd.nist.gov/developers
- **CVSS Calculator**: https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator
- **CWE Database**: https://cwe.mitre.org

---

**Quick Links**:
- [Full Documentation](./CVE_DATABASE_IMPLEMENTATION.md)
- [Service README](./services/cve_sync_service/README.md)
- [Test Script](./scripts/test_cve_database.sh)
