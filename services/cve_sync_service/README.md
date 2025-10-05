# CVE Sync Service

**Live Vulnerability Database Synchronization for Voltaxe Clarity Hub**

## Overview

The CVE Sync Service is a background microservice that automatically downloads and maintains a local database of CVE (Common Vulnerabilities and Exposures) data from the NIST National Vulnerability Database (NVD).

## Features

- **Automated Daily Sync**: Runs every 24 hours to fetch new and updated CVEs
- **NIST NVD API Integration**: Official API v2.0 with authentication support
- **Comprehensive Data**: CVSS scores, severity ratings, attack vectors, affected products
- **Smart Rate Limiting**: Respects NVD API limits (50 req/30s with key, 5 req/30s without)
- **Incremental Updates**: Only fetches CVEs from last 120 days by default
- **Production Ready**: Docker-based, fault-tolerant, comprehensive logging

## How It Works

```
┌─────────────────┐
│  NIST NVD API   │
│  (nvd.nist.gov) │
└────────┬────────┘
         │
         │ Daily Sync (24h interval)
         │
         ▼
┌─────────────────┐
│  CVE Sync       │
│  Service        │ ←── NVD_API_KEY
└────────┬────────┘
         │
         │ Inserts/Updates
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  cve_database   │ ──→ Backend API ──→ Frontend
└─────────────────┘
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `NVD_API_KEY` | No | - | NIST NVD API key (highly recommended) |
| `SYNC_INTERVAL_HOURS` | No | 24 | Hours between syncs |
| `DAYS_BACK` | No | 120 | How many days of CVEs to fetch |

## Getting an NVD API Key

1. Visit https://nvd.nist.gov/developers/request-an-api-key
2. Fill out the request form with your email
3. Check your email for the API key
4. Add to `.env`: `NVD_API_KEY=your-key-here`

**Benefits of API Key:**
- 50 requests per 30 seconds (vs 5 without key)
- ~10x faster sync times
- Priority access during high-traffic periods

## Database Schema

The service populates the `cve_database` table:

```sql
CREATE TABLE cve_database (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR UNIQUE NOT NULL,
    description TEXT,
    cvss_v3_score FLOAT,
    cvss_v3_vector VARCHAR,
    cvss_v2_score FLOAT,
    cvss_v2_vector VARCHAR,
    severity VARCHAR,
    attack_vector VARCHAR,
    published_date TIMESTAMP,
    last_modified TIMESTAMP,
    references JSON,
    cpe_configurations JSON,
    affected_products JSON,
    exploitability_score FLOAT,
    impact_score FLOAT,
    weaknesses JSON,
    vendor_comments JSON,
    is_active BOOLEAN DEFAULT TRUE,
    sync_timestamp TIMESTAMP DEFAULT NOW()
);
```

## Running the Service

### Docker Compose (Recommended)

Already configured in `docker-compose.yml`:

```bash
# Start all services including CVE sync
docker-compose up -d

# View CVE sync logs
docker-compose logs -f cve_sync

# Restart just the CVE sync service
docker-compose restart cve_sync
```

### Standalone

```bash
cd services/cve_sync_service

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/voltaxe_clarity_hub"
export NVD_API_KEY="your-api-key"

# Run
python main.py
```

## Sync Process

1. **Connect to Database**: Establishes PostgreSQL connection
2. **Fetch CVEs**: Downloads CVEs from last 120 days via NVD API
3. **Parse Data**: Extracts CVSS scores, descriptions, references, etc.
4. **Save to Database**: Inserts new CVEs or updates existing ones
5. **Log Results**: Reports statistics (new, updated, errors)
6. **Sleep**: Waits 24 hours before next sync

## Performance

**With API Key:**
- ~2,000 CVEs per minute
- Full 120-day sync: ~10-15 minutes
- Daily incremental: ~1-2 minutes

**Without API Key:**
- ~200 CVEs per minute
- Full 120-day sync: ~1-2 hours
- Daily incremental: ~5-10 minutes

## Monitoring

### Check Sync Status

```bash
# View real-time logs
docker-compose logs -f cve_sync

# Check last sync time
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "SELECT COUNT(*), MAX(sync_timestamp) FROM cve_database;"

# Count CVEs by severity
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub \
  -c "SELECT severity, COUNT(*) FROM cve_database GROUP BY severity ORDER BY COUNT(*) DESC;"
```

### Log Files

Logs are written to `/app/logs/cve_sync.log` inside the container and `./logs/cve_sync.log` on the host.

## Troubleshooting

### Service won't start

```bash
# Check service status
docker-compose ps cve_sync

# View error logs
docker-compose logs cve_sync

# Restart service
docker-compose restart cve_sync
```

### Rate limit errors

- **Solution 1**: Add NVD API key to `.env`
- **Solution 2**: Reduce `DAYS_BACK` to fewer days
- **Solution 3**: Increase `SYNC_INTERVAL_HOURS` to sync less frequently

### Database connection errors

```bash
# Verify database is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U voltaxe_admin -d voltaxe_clarity_hub -c "\dt"
```

### No CVEs syncing

1. Check API key is valid
2. Verify internet connectivity
3. Check NVD API status: https://nvd.nist.gov/
4. Review logs for specific errors

## Manual Sync Trigger

To trigger an immediate sync without waiting:

```bash
# Restart the service
docker-compose restart cve_sync

# Watch the logs
docker-compose logs -f cve_sync
```

## Integration with Backend API

The Backend API (`clarity_hub_api`) automatically uses the populated CVE database:

```python
# Before: Mock data
return mock_cve_data[cve_id]

# After: Real database query
cve = db.query(CVEDB).filter(CVEDB.cve_id == cve_id).first()
return cve.to_dict()
```

This makes CVE lookups:
- ✅ **Instant**: No API calls needed
- ✅ **Reliable**: No rate limits or timeouts
- ✅ **Comprehensive**: Full NIST data with references
- ✅ **Fresh**: Auto-updated daily

## Production Considerations

### High Availability

For production deployments:

1. **Database Backups**: Schedule regular backups of `cve_database` table
2. **Monitoring**: Set up alerts for sync failures
3. **Redundancy**: Run multiple sync instances with leader election
4. **Caching**: Add Redis cache layer for frequently accessed CVEs

### Security

- Store `NVD_API_KEY` in secrets manager (AWS Secrets Manager, Vault)
- Use read-only database user for API queries
- Enable SSL for database connections
- Rotate API keys periodically

### Optimization

- **Incremental Sync**: Reduce `DAYS_BACK` to 30 after initial full sync
- **Compression**: Enable gzip compression for API requests
- **Batch Processing**: Process CVEs in batches of 500
- **Parallel Processing**: Use multiprocessing for large syncs

## API Endpoints

The Backend API exposes:

### GET /vulnerabilities/{cve_id}

Returns detailed CVE information from the local database.

**Example:**
```bash
curl http://localhost:8000/vulnerabilities/CVE-2024-12345
```

**Response:**
```json
{
  "id": "CVE-2024-12345",
  "cvssScore": 9.8,
  "severity": "CRITICAL",
  "attackVector": "NETWORK",
  "summary": "Remote code execution vulnerability...",
  "affectedEndpoints": ["web-server-01", "api-gateway-02"],
  "publishedDate": "2024-09-15",
  "lastModified": "2024-09-20",
  "references": [
    "https://nvd.nist.gov/vuln/detail/CVE-2024-12345",
    "https://vendor.com/security-advisory"
  ]
}
```

## Architecture Benefits

### Before (Mock Data)
```
Frontend → Backend API → Mock JSON → Response
                 ↓
          (Hardcoded, Stale, Limited)
```

### After (Live Database)
```
Frontend → Backend API → PostgreSQL (CVE DB) → Response
                              ↑
                    Daily Sync from NIST NVD
                    (Fresh, Comprehensive, Real)
```

## Future Enhancements

- [ ] Webhook notifications for critical CVEs
- [ ] Automatic vulnerability scanning of detected software
- [ ] EPSS (Exploit Prediction Scoring System) integration
- [ ] CVE trending and analytics dashboard
- [ ] Export to STIX/TAXII threat intelligence feeds
- [ ] Integration with vulnerability scanners (Nessus, Qualys)

## Support

For issues or questions:
1. Check logs: `docker-compose logs cve_sync`
2. Review documentation: https://nvd.nist.gov/developers
3. Open GitHub issue with logs and configuration

---

**Built with ❤️ for Voltaxe Clarity Hub**
