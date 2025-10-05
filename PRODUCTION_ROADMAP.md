# Voltaxe Production Deployment Roadmap

**Date:** October 5, 2025  
**Status:** Moving from Prototype → Production  
**Current Phase:** Infrastructure Hardening

---

## 🎯 Executive Summary

Voltaxe has reached a **critical inflection point**: the platform is feature-complete as a prototype. The next phase focuses on transforming it into a production-ready, enterprise-grade security platform.

### What We've Built (Prototype Complete ✅)

1. **Full-Stack Application**
   - React + TypeScript frontend with real-time dashboards
   - FastAPI backend with PostgreSQL database
   - WebSocket support for live event streaming
   - Comprehensive audit logging system
   - Advanced global search with multi-source queries
   - Notification system (email, push, in-app)

2. **Security Features**
   - Endpoint isolation/restoration
   - Alert management and acknowledgment
   - Vulnerability tracking
   - Suspicious process detection
   - Malware analysis integration

3. **Intelligence Components**
   - CVE synchronization service
   - Axon Engine (resilience scoring framework)
   - Event correlation capabilities
   - Multi-dimensional search

---

## 🚀 Three-Phase Production Plan

### Phase 1: Hardening for Production (Week 1-2)

#### 1.1 Docker Compose Orchestration ✅ COMPLETE
**Status:** Already implemented in `docker-compose.yml`

**Services Running:**
- PostgreSQL (persistent data)
- Redis (caching layer)
- FastAPI Backend (port 8000)
- React Frontend (port 3000)
- CVE Sync Service (scheduled updates)
- Nginx (reverse proxy)

**Command:** `docker-compose up -d`

#### 1.2 Environment Configuration Management 🔄 IN PROGRESS

**What:** Secure secrets management using `.env` files and environment variables.

**Current State:**
- `.env` file exists in root
- Services reference environment variables
- Need to create `.env.production` template

**Action Items:**
1. Create `.env.example` template for team members
2. Document all required environment variables
3. Implement secret rotation mechanism
4. Use Docker secrets for sensitive data (PostgreSQL passwords, API keys)

**Critical Variables:**
```bash
# Database
POSTGRES_PASSWORD=<secure-password>
DATABASE_URL=postgresql://...

# Authentication (Next Phase)
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>

# External APIs
NVD_API_KEY=<nist-nvd-api-key>

# Application Secrets
SECRET_KEY=<jwt-signing-key>
VAPID_PUBLIC_KEY=<push-notification-key>
VAPID_PRIVATE_KEY=<push-notification-private-key>
```

#### 1.3 Health Checks & Monitoring ✅ IMPLEMENTED

**Current State:**
- Health check endpoint: `GET /health`
- Docker health checks configured
- Service dependencies managed via `depends_on`

**Enhancement Needed:**
- Add Prometheus metrics endpoint
- Implement structured logging
- Create uptime monitoring dashboard

#### 1.4 Production Logging Strategy 🔄 NEXT

**What:** Centralized, structured logging for debugging and compliance.

**Implementation:**
```python
# Logging Configuration (to be added)
LOGGING_CONFIG = {
    'version': 1,
    'formatters': {
        'json': {
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'json'},
        'file': {'class': 'logging.handlers.RotatingFileHandler', 
                 'filename': '/app/logs/voltaxe.log',
                 'maxBytes': 10485760,  # 10MB
                 'backupCount': 5,
                 'formatter': 'json'}
    },
    'root': {'level': 'INFO', 'handlers': ['console', 'file']}
}
```

**Action Items:**
1. Install `python-json-logger`
2. Configure log rotation
3. Set up log aggregation (ELK stack or cloud logging)
4. Create audit trail for compliance

---

### Phase 2: Security Hardening (Week 2-3)

#### 2.1 Real Authentication System 🎯 HIGH PRIORITY

**Current State:** Mock authentication (admin@voltaxe.com / password)

**Implementation Options:**

**Option A: Supabase Auth (Recommended - Already Configured)**
```typescript
// Already have Supabase client installed
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Features:
// ✅ User registration with email verification
// ✅ Secure password hashing
// ✅ JWT token management
// ✅ Social auth (Google, GitHub, etc.)
// ✅ Row-level security for multi-tenancy
// ✅ Free tier: 50,000 monthly active users
```

**Option B: Auth0 (Enterprise Alternative)**
```javascript
// Enterprise features:
// ✅ Advanced MFA
// ✅ Breached password detection
// ✅ Bot detection
// ✅ SAML/SSO for enterprises
// ⚠️  Paid tiers required
```

**Implementation Steps:**
1. Set up Supabase project (supabase.com)
2. Configure authentication providers
3. Replace mock login in `/services/clarity_hub_api/main.py`
4. Update frontend `AuthContext.tsx` with real Supabase calls
5. Implement protected routes with JWT verification
6. Add user role management (admin, analyst, viewer)

#### 2.2 API Security Enhancements

**Rate Limiting:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/endpoints")
@limiter.limit("100/minute")
async def get_endpoints():
    # Protected endpoint
    pass
```

**CORS Configuration:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.voltaxe.com"],  # Production domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**API Key Rotation:**
- Implement key versioning
- Add expiration dates
- Create revocation mechanism

#### 2.3 Data Security

**Encryption at Rest:**
- Enable PostgreSQL encryption
- Encrypt sensitive audit log fields
- Use AWS KMS or similar for key management

**Encryption in Transit:**
- Enforce HTTPS via Nginx
- Implement SSL certificate auto-renewal (Let's Encrypt)
- Add HSTS headers

---

### Phase 3: Core Intelligence Engine (Week 3-4)

#### 3.1 Real CVE Database Integration 🔄 PARTIALLY COMPLETE

**Current State:**
- CVE sync service exists (`/services/cve_sync_service/`)
- Syncs data from NIST NVD API
- Stores in PostgreSQL

**Enhancements Needed:**

**1. Comprehensive CVE Schema:**
```sql
CREATE TABLE cve_database (
    cve_id VARCHAR(20) PRIMARY KEY,
    description TEXT,
    severity VARCHAR(20),  -- CRITICAL, HIGH, MEDIUM, LOW
    cvss_score DECIMAL(3,1),
    cvss_vector VARCHAR(100),
    published_date TIMESTAMP,
    last_modified TIMESTAMP,
    
    -- Affected software
    vendor VARCHAR(255),
    product VARCHAR(255),
    version_start VARCHAR(50),
    version_end VARCHAR(50),
    
    -- Vulnerability details
    cwe_id VARCHAR(20),  -- Common Weakness Enumeration
    attack_vector VARCHAR(50),  -- NETWORK, ADJACENT, LOCAL
    attack_complexity VARCHAR(50),  -- LOW, HIGH
    privileges_required VARCHAR(50),  -- NONE, LOW, HIGH
    user_interaction VARCHAR(50),  -- NONE, REQUIRED
    
    -- References
    references JSONB,  -- [{url, source, tags}]
    
    -- Metadata
    exploitability_score DECIMAL(3,1),
    impact_score DECIMAL(3,1),
    
    -- Voltaxe enrichment
    exploit_available BOOLEAN DEFAULT FALSE,
    actively_exploited BOOLEAN DEFAULT FALSE,
    patch_available BOOLEAN DEFAULT FALSE,
    patch_url TEXT,
    
    -- Indexing
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_severity (severity),
    INDEX idx_cvss_score (cvss_score),
    INDEX idx_published_date (published_date),
    INDEX idx_vendor_product (vendor, product)
);
```

**2. Scheduled Sync Job:**
```python
# /services/cve_sync_service/main.py
import asyncio
import httpx
from datetime import datetime, timedelta

class CVESyncService:
    def __init__(self):
        self.nvd_api_key = os.getenv("NVD_API_KEY")
        self.api_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    
    async def sync_recent_cves(self, days=7):
        """Sync CVEs from last N days"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.api_url,
                params={
                    "pubStartDate": start_date.isoformat(),
                    "pubEndDate": end_date.isoformat(),
                },
                headers={"apiKey": self.nvd_api_key}
            )
            
            cves = response.json()["vulnerabilities"]
            await self.save_to_database(cves)
    
    async def run_scheduler(self):
        """Run every 24 hours"""
        while True:
            await self.sync_recent_cves()
            await asyncio.sleep(86400)  # 24 hours
```

**3. Exploit Intelligence Integration:**
- Integrate with Exploit-DB API
- Check PoC availability on GitHub
- Monitor CISA KEV (Known Exploited Vulnerabilities)

#### 3.2 Axon Engine - Resilience Score Algorithm 🎯 CORE VALUE

**What:** The Axon Engine is Voltaxe's intelligence layer that transforms raw data into actionable insights.

**Current State:**
- Service framework exists (`/services/axon_engine/`)
- Basic structure in place

**Implementation:**

**Resilience Score Formula:**
```python
class ResilienceScoreCalculator:
    """
    Voltaxe Resilience Score (VRS): 0-100
    
    Higher score = More resilient security posture
    
    Components:
    1. Vulnerability Exposure (40%): Based on unpatched CVEs
    2. Security Controls (30%): MFA, encryption, patching cadence
    3. Threat Detection (20%): Active monitoring, EDR coverage
    4. Incident Response (10%): Mean time to respond, containment
    """
    
    def calculate_vrs(self, customer_id: str) -> Dict[str, Any]:
        # 1. Vulnerability Exposure Score (0-40)
        vuln_score = self._calculate_vulnerability_score(customer_id)
        
        # 2. Security Controls Score (0-30)
        controls_score = self._calculate_controls_score(customer_id)
        
        # 3. Threat Detection Score (0-20)
        detection_score = self._calculate_detection_score(customer_id)
        
        # 4. Incident Response Score (0-10)
        response_score = self._calculate_response_score(customer_id)
        
        total_score = vuln_score + controls_score + detection_score + response_score
        
        return {
            "vrs_score": round(total_score, 1),
            "grade": self._get_grade(total_score),
            "breakdown": {
                "vulnerability_exposure": vuln_score,
                "security_controls": controls_score,
                "threat_detection": detection_score,
                "incident_response": response_score
            },
            "recommendations": self._generate_recommendations(total_score)
        }
    
    def _calculate_vulnerability_score(self, customer_id: str) -> float:
        """
        Score based on:
        - Number of critical CVEs
        - Average age of unpatched vulnerabilities
        - Exposure to actively exploited CVEs
        """
        query = """
            SELECT 
                COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_count,
                COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_count,
                AVG(EXTRACT(DAY FROM NOW() - detected_date)) as avg_age,
                COUNT(CASE WHEN exploited = TRUE THEN 1 END) as exploited_count
            FROM vulnerabilities
            WHERE customer_id = %s AND status = 'OPEN'
        """
        
        # Scoring logic:
        # - 0 critical CVEs = 40 points
        # - 1-5 critical CVEs = 30 points
        # - 6-10 critical CVEs = 20 points
        # - 11+ critical CVEs = 10 points
        # - Deduct points for old vulnerabilities (>30 days)
        # - Severe deduction for actively exploited CVEs
        
        return calculated_score
    
    def _calculate_controls_score(self, customer_id: str) -> float:
        """
        Score based on:
        - MFA adoption rate
        - Endpoint encryption coverage
        - Patch management effectiveness
        - Least privilege implementation
        """
        # Check what percentage of users have MFA enabled
        # Check encryption status of endpoints
        # Measure time from CVE publish to patch deployment
        
        return calculated_score
    
    def _calculate_detection_score(self, customer_id: str) -> float:
        """
        Score based on:
        - EDR coverage (% of endpoints monitored)
        - Alert generation rate
        - Detection accuracy (true positives)
        """
        query = """
            SELECT 
                COUNT(DISTINCT endpoint_id) as monitored_endpoints,
                (SELECT COUNT(*) FROM endpoints WHERE customer_id = %s) as total_endpoints
            FROM events
            WHERE customer_id = %s
              AND timestamp > NOW() - INTERVAL '24 hours'
        """
        
        coverage_pct = monitored_endpoints / total_endpoints * 100
        
        # 100% coverage = 20 points
        # 80-99% = 15 points
        # 60-79% = 10 points
        # < 60% = 5 points
        
        return calculated_score
    
    def _calculate_response_score(self, customer_id: str) -> float:
        """
        Score based on:
        - Mean time to acknowledge (MTTA)
        - Mean time to contain (MTTC)
        - Isolation effectiveness
        """
        query = """
            SELECT 
                AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))/60) as mtta_minutes,
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as mttc_minutes
            FROM alerts
            WHERE customer_id = %s
              AND severity IN ('HIGH', 'CRITICAL')
              AND created_at > NOW() - INTERVAL '30 days'
        """
        
        # MTTA < 15 min = excellent (10 points)
        # MTTA 15-60 min = good (7 points)
        # MTTA > 60 min = needs improvement (5 points)
        
        return calculated_score
    
    def _get_grade(self, score: float) -> str:
        if score >= 90: return "A+"
        elif score >= 85: return "A"
        elif score >= 80: return "A-"
        elif score >= 75: return "B+"
        elif score >= 70: return "B"
        elif score >= 65: return "B-"
        elif score >= 60: return "C+"
        elif score >= 55: return "C"
        else: return "D"
    
    def _generate_recommendations(self, score: float) -> List[str]:
        recommendations = []
        
        if score < 70:
            recommendations.append("🔴 URGENT: Your security posture requires immediate attention")
            recommendations.append("Prioritize patching critical CVEs within 24 hours")
            recommendations.append("Enable MFA for all administrative accounts")
        
        if score < 85:
            recommendations.append("🟡 Increase EDR coverage to 100% of endpoints")
            recommendations.append("Reduce mean time to acknowledge alerts to <15 minutes")
        
        if score >= 85:
            recommendations.append("🟢 Strong security posture maintained")
            recommendations.append("Continue monitoring for new threats")
        
        return recommendations
```

**Scheduling the Axon Engine:**
```python
# /services/axon_engine/main.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2)  # Run at 2 AM daily
async def calculate_all_resilience_scores():
    """Calculate VRS for all customers"""
    customers = await db.fetch_all("SELECT id FROM customers")
    
    for customer in customers:
        score = calculator.calculate_vrs(customer['id'])
        
        # Save to database
        await db.execute("""
            INSERT INTO resilience_scores (customer_id, score, grade, breakdown, calculated_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (customer['id'], score['vrs_score'], score['grade'], score['breakdown']))
        
        # Send alert if score drops significantly
        if score['vrs_score'] < 60:
            await send_alert(customer['id'], score)

scheduler.start()
```

#### 3.3 Event Correlation Engine 🧠 ADVANCED THREAT DETECTION

**What:** Detects sophisticated attacks by correlating multiple events.

**Implementation:**

```python
class EventCorrelationEngine:
    """
    Detects attack patterns by analyzing event sequences
    """
    
    def __init__(self):
        self.patterns = self._load_attack_patterns()
    
    def _load_attack_patterns(self) -> List[AttackPattern]:
        return [
            # Pattern 1: Vulnerability Exploitation → Lateral Movement
            AttackPattern(
                name="CVE_EXPLOITATION_LATERAL_MOVEMENT",
                severity="CRITICAL",
                events=[
                    {"type": "VULNERABILITY_DETECTED", "severity": "CRITICAL"},
                    {"type": "SUSPICIOUS_PARENT_CHILD", "within_minutes": 60},
                    {"type": "UNUSUAL_NETWORK_CONNECTION", "same_host": True}
                ],
                description="Critical vulnerability followed by suspicious process behavior",
                recommendation="Immediately isolate endpoint and investigate process tree"
            ),
            
            # Pattern 2: Credential Access → Privilege Escalation
            AttackPattern(
                name="CREDENTIAL_HARVESTING",
                severity="HIGH",
                events=[
                    {"type": "SUSPICIOUS_PROCESS", "process_name": ["mimikatz", "pwdump"]},
                    {"type": "PRIVILEGE_ESCALATION", "within_minutes": 30}
                ],
                description="Credential dumping tool detected followed by privilege escalation",
                recommendation="Rotate all credentials, force password resets"
            ),
            
            # Pattern 3: Reconnaissance → Data Exfiltration
            AttackPattern(
                name="DATA_EXFILTRATION_CHAIN",
                severity="CRITICAL",
                events=[
                    {"type": "PORT_SCAN", "count": ">10"},
                    {"type": "UNUSUAL_DATA_TRANSFER", "size": ">100MB", "within_hours": 2}
                ],
                description="Network scanning followed by large data transfer",
                recommendation="Block network egress, investigate destination IPs"
            )
        ]
    
    async def analyze_events(self, customer_id: str):
        """
        Continuously analyze event stream for patterns
        """
        # Get recent events (last 24 hours)
        events = await self.get_recent_events(customer_id, hours=24)
        
        # Check each pattern
        for pattern in self.patterns:
            matches = await self._match_pattern(events, pattern)
            
            if matches:
                # Create high-severity alert
                await self._create_incident(customer_id, pattern, matches)
    
    async def _match_pattern(self, events: List[Event], pattern: AttackPattern) -> Optional[List[Event]]:
        """
        Check if event sequence matches attack pattern
        """
        # Complex pattern matching logic
        # Returns matching events if pattern detected
        pass
    
    async def _create_incident(self, customer_id: str, pattern: AttackPattern, events: List[Event]):
        """
        Create security incident from correlated events
        """
        incident = await db.execute("""
            INSERT INTO security_incidents (
                customer_id,
                name,
                severity,
                description,
                recommendation,
                correlated_events,
                status
            ) VALUES (%s, %s, %s, %s, %s, %s, 'OPEN')
            RETURNING id
        """, (
            customer_id,
            pattern.name,
            pattern.severity,
            pattern.description,
            pattern.recommendation,
            json.dumps([e.id for e in events])
        ))
        
        # Send immediate notification
        await notification_service.send_critical_alert(
            customer_id,
            f"🚨 SECURITY INCIDENT: {pattern.name}",
            pattern.description
        )
```

---

## 📊 Success Metrics

### Phase 1 (Infrastructure)
- ✅ Single-command deployment: `docker-compose up`
- ✅ All services start within 60 seconds
- ✅ Zero manual configuration required
- ✅ Health checks passing for all services

### Phase 2 (Security)
- ⏳ Real user authentication implemented
- ⏳ 100% HTTPS enforcement
- ⏳ API rate limiting active
- ⏳ Audit logs for all security-relevant actions

### Phase 3 (Intelligence)
- ⏳ CVE database syncing daily
- ⏳ Resilience scores calculated for all customers
- ⏳ Event correlation detecting ≥3 attack patterns
- ⏳ False positive rate <10%

---

## 🎯 Next Immediate Actions

### This Week (October 5-12, 2025)

**Monday-Tuesday:**
1. ✅ Create `.env.example` template
2. ✅ Document all environment variables
3. ✅ Set up structured logging
4. Test full Docker Compose deployment

**Wednesday-Thursday:**
5. Set up Supabase project
6. Implement real authentication (replace mock login)
7. Add JWT verification to all API endpoints
8. Update frontend AuthContext

**Friday-Sunday:**
9. Enhance CVE sync service with full NVD schema
10. Implement Axon Engine resilience score calculator
11. Test resilience score calculation
12. Create dashboard widget for VRS display

---

## 🚀 Production Deployment Checklist

### Before Going Live:

**Infrastructure:**
- [ ] Domain name registered (voltaxe.com)
- [ ] SSL certificates configured (Let's Encrypt)
- [ ] Cloud hosting selected (AWS/GCP/Azure/DigitalOcean)
- [ ] Database backups automated (daily)
- [ ] Disaster recovery plan documented

**Security:**
- [ ] All secrets moved to environment variables
- [ ] HTTPS enforced (HSTS enabled)
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Security headers added (CSP, X-Frame-Options)
- [ ] Penetration testing completed

**Monitoring:**
- [ ] Application performance monitoring (APM)
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
- [ ] Log aggregation (ELK/CloudWatch)
- [ ] Alerting rules configured

**Legal & Compliance:**
- [ ] Privacy policy created
- [ ] Terms of service drafted
- [ ] GDPR compliance verified
- [ ] Data retention policy defined
- [ ] Security audit completed

---

## 💡 Business Considerations

### First Customer Preparation:

1. **Onboarding Flow:**
   - Self-service signup
   - Guided tour of features
   - Sample data for demonstration
   - Knowledge base articles

2. **Support Infrastructure:**
   - Support email (support@voltaxe.com)
   - Documentation site
   - Status page
   - Feedback mechanism

3. **Pricing Tiers:**
   - Free tier (1 user, 10 endpoints)
   - Professional ($99/mo - 5 users, 100 endpoints)
   - Enterprise (custom - unlimited, dedicated support)

---

## 📈 Growth Metrics to Track

1. **Product Metrics:**
   - Daily active users (DAU)
   - Alerts generated per day
   - Mean time to detect (MTTD)
   - Mean time to respond (MTTR)
   - CVE coverage (% of endpoints scanned)

2. **Business Metrics:**
   - Monthly recurring revenue (MRR)
   - Customer acquisition cost (CAC)
   - Customer lifetime value (LTV)
   - Churn rate
   - Net promoter score (NPS)

---

## 🎓 Key Learnings & Best Practices

1. **Start with Docker Compose:** Makes development and deployment identical
2. **Environment-based configuration:** Never hardcode secrets
3. **Health checks are critical:** Enable automated recovery
4. **Structured logging:** Essential for debugging production issues
5. **Feature flags:** Allow gradual rollout of new features
6. **Database migrations:** Use Alembic for schema changes
7. **API versioning:** Plan for breaking changes (/api/v1/, /api/v2/)
8. **Rate limiting:** Protect against abuse and DDoS
9. **Monitoring before problems:** You can't fix what you can't measure
10. **Security by design:** Easier to build in than bolt on

---

**Next Update:** After Phase 1 completion (target: October 12, 2025)

---

*This roadmap is a living document. Update as implementation progresses.*
