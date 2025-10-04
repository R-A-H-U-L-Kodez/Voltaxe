# 🚀 Voltaxe Enterprise Features - Implementation Roadmap

## 📊 Current Status
✅ **Enhanced PDF Reports** - Professional 6-page design with shadows, gradients, and modern styling
✅ **Malware Signatures** - Fixed to display actual YARA rule names
✅ **Clean ASCII Rendering** - No emoji corruption
✅ **Team Management Page** - Created (needs route integration)

---

## 🎯 Phase 1: Core Product & Usability Features

### 1.1 Team & User Management ⏳ IN PROGRESS
**Status:** Frontend component created, needs backend API integration

**What's Done:**
- ✅ Team Management Page UI (`TeamManagementPage.tsx`)
- ✅ User roles: Admin, Analyst, Viewer
- ✅ Invite system UI
- ✅ Role management interface
- ✅ User status tracking (Active, Pending, Suspended)

**Next Steps:**
1. **Backend API Endpoints** (`clarity_hub_api/routers/team.py`):
   ```python
   POST   /api/team/invite           # Send invitation email
   GET    /api/team/members          # List all team members
   PUT    /api/team/members/{id}     # Update member role/status
   DELETE /api/team/members/{id}     # Remove team member
   POST   /api/team/accept-invite    # Accept invitation (public endpoint)
   ```

2. **Database Schema** (Add to PostgreSQL):
   ```sql
   CREATE TABLE team_members (
       id UUID PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       name VARCHAR(255) NOT NULL,
       role VARCHAR(50) NOT NULL,  -- Admin, Analyst, Viewer
       status VARCHAR(50) NOT NULL, -- active, pending, suspended
       invited_at TIMESTAMP NOT NULL,
       invited_by UUID REFERENCES team_members(id),
       last_active TIMESTAMP,
       invitation_token VARCHAR(255) UNIQUE,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Email Integration**:
   - Install SendGrid: `pip install sendgrid`
   - Create email templates for invitations
   - Configure SMTP settings in environment variables

4. **Route Integration**:
   - Add to `App.tsx`: Route for `/team` page
   - Add to `Sidebar.tsx`: Navigation link with Users icon

---

### 1.2 Global Search Functionality 🔜 NEXT
**Priority:** HIGH
**Estimated Time:** 4-6 hours

**Implementation Plan:**

**Frontend Components:**
```typescript
// components/GlobalSearch.tsx
- Search input in header (replaces non-functional one)
- Dropdown with categorized results:
  * Endpoints (by hostname)
  * Alerts (by type, severity)
  * CVEs (by ID, description)
  * Malware files
  * Events
- Keyboard shortcuts (Cmd/Ctrl + K to open)
- Recent searches
- Search filters (by type, date range)
```

**Backend API:**
```python
# clarity_hub_api/routers/search.py
GET /api/search?q={query}&type={filter}&limit={n}

Response:
{
  "endpoints": [...],
  "alerts": [...],
  "cves": [...],
  "malware": [...],
  "events": [...]
}
```

**Database Queries:**
```sql
-- Full-text search across multiple tables
SELECT * FROM snapshots WHERE hostname ILIKE '%query%'
UNION
SELECT * FROM alerts WHERE details ILIKE '%query%'
UNION
SELECT * FROM vulnerability_events WHERE cve_id ILIKE '%query%'
UNION
SELECT * FROM malware_scans WHERE file_name ILIKE '%query%'
```

**Files to Create:**
1. `/services/clarity_hub_ui/src/components/GlobalSearch.tsx`
2. `/services/clarity_hub_api/routers/search.py`
3. Update header in `Sidebar.tsx` or create `Header.tsx`

---

### 1.3 Onboarding & Agent Deployment Flow 🔜 PLANNED
**Priority:** MEDIUM-HIGH
**Estimated Time:** 8-12 hours

**Components to Build:**

**1. Add Endpoint Page:**
```typescript
// pages/AddEndpointPage.tsx
Features:
- Platform selection (Windows, Linux, macOS)
- One-click download button
- Installation instructions (step-by-step)
- Unique agent token generation
- Pre-configured installer with embedded token
- Progress indicator (pending → connected)
```

**2. Installer Generator:**
```python
# clarity_hub_api/routers/agent_deployment.py
POST /api/agents/generate-installer

Request:
{
  "platform": "linux",
  "organization_id": "uuid",
  "custom_config": {...}
}

Response:
{
  "download_url": "https://..../installer.sh",
  "token": "eyJhbGc...",
  "installation_command": "curl -sSL ... | sudo bash"
}
```

**3. Agent Registration Flow:**
```
1. User clicks "Add Endpoint" → Navigate to /add-endpoint
2. Select platform (Win/Linux/Mac)
3. Generate unique token
4. Download pre-configured installer
5. Run installer on target machine
6. Agent auto-registers with API using embedded token
7. Endpoint appears in dashboard within 30s
```

**Security Considerations:**
- Token expiration (24 hours)
- One-time use tokens
- Revocation mechanism
- Rate limiting on downloads

---

### 1.4 Customizable Reporting 🔜 PLANNED
**Priority:** MEDIUM
**Estimated Time:** 6-8 hours

**Enhanced Report Generation:**

**Frontend Modal:**
```typescript
// components/CustomReportModal.tsx
Options:
- Date range selector (Last 7/30/90 days, Custom)
- Sections to include:
  ✓ Executive Summary
  ✓ Endpoint Status
  ✓ Critical Alerts
  ✓ Vulnerabilities
  ✓ Rootkit Detections
  ✓ Malware Analysis
  ✓ Recommendations
- Format: PDF / HTML / JSON
- Recipients (email addresses)
- Schedule (one-time / daily / weekly / monthly)
```

**Backend Enhancements:**
```python
# Update reportGenerator.ts to accept options
interface ReportOptions {
  dateRange: {start: Date, end: Date};
  sections: string[];
  format: 'pdf' | 'html' | 'json';
  includeCharts: boolean;
}

# Add scheduled reports table
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY,
  user_id UUID,
  options JSONB,
  frequency VARCHAR(50), -- one-time, daily, weekly, monthly
  next_run TIMESTAMP,
  recipients TEXT[]
);
```

---

## 🧠 Phase 2: Intelligence & Automation (Axon Engine)

### 2.1 Resilience Score Widget 🔜 PLANNED
**Priority:** HIGH
**Estimated Time:** 10-15 hours

**Implementation:**

**Frontend Widget:**
```typescript
// components/ResilienceScoreWidget.tsx
Display:
- Large circular gauge (0-100 score)
- Color-coded (Red <40, Orange 40-70, Green >70)
- Trend indicator (↑↓ vs last week)
- Breakdown by category:
  * Vulnerability Coverage: 30%
  * Threat Response Time: 25%
  * System Hardening: 20%
  * Patch Compliance: 15%
  * Security Awareness: 10%
```

**Axon Engine Calculation:**
```python
# axon_engine/resilience_calculator.py
def calculate_resilience_score(org_id: str) -> ResilienceScore:
    """
    Calculate overall security resilience score
    
    Factors:
    1. Vulnerability Coverage (30%)
       - % of known CVEs patched
       - Time to patch critical vulns
    
    2. Threat Response (25%)
       - Alert acknowledgment time
       - Incident resolution time
       
    3. System Hardening (20%)
       - Firewall rules configured
       - Unnecessary services disabled
       - Strong authentication enabled
    
    4. Patch Compliance (15%)
       - OS update status
       - Software version currency
    
    5. Security Awareness (10%)
       - User training completion
       - Phishing test pass rate
    """
    return ResilienceScore(
        overall=85,
        vulnerability_coverage=90,
        threat_response=80,
        system_hardening=85,
        patch_compliance=88,
        security_awareness=75,
        trend="+5",  # vs last week
        recommendations=[...]
    )
```

**Database Tracking:**
```sql
CREATE TABLE resilience_history (
  id UUID PRIMARY KEY,
  organization_id UUID,
  score INTEGER,
  breakdown JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2.2 Incident Correlation Engine 🔜 PLANNED
**Priority:** HIGH
**Estimated Time:** 15-20 hours

**Axon Engine Intelligence:**

```python
# axon_engine/correlation_engine.py
class IncidentCorrelationEngine:
    """
    Groups related alerts into cohesive incidents
    
    Correlation Rules:
    1. Temporal: Events within 5 minutes
    2. Spatial: Same endpoint/network
    3. Causal: Known attack patterns
    4. Similarity: Similar IOCs/signatures
    """
    
    def correlate_events(self, events: List[Event]) -> List[Incident]:
        incidents = []
        
        # Rule 1: CVE + Malware on same host
        for vuln in vulnerabilities:
            malware = find_malware_on_host(vuln.hostname, 
                                          within=timedelta(hours=24))
            if malware:
                incidents.append(Incident(
                    type="Exploitation Attempt",
                    severity="critical",
                    events=[vuln, malware],
                    confidence=0.85,
                    mitre_tactics=["TA0001", "TA0002"]
                ))
        
        # Rule 2: Failed logins + Privilege escalation
        # Rule 3: Port scan + Exploit attempt
        # Rule 4: Data exfiltration pattern
        
        return incidents
```

**UI Changes:**
```typescript
// Update AlertsPage.tsx to show Incidents
Interface:
- Group related alerts under expandable incidents
- Show attack timeline
- Display MITRE ATT&CK tactics
- Incident severity based on combined risk
- One-click acknowledge entire incident
```

---

### 2.3 Automated Response (Strike Module) 🔜 PLANNED
**Priority:** CRITICAL
**Estimated Time:** 20-30 hours

**Architecture:**

```
User Action (UI) 
  ↓
clarity_hub_api (/api/endpoints/{id}/isolate)
  ↓
Strike Module (strike_orchestrator.py)
  ↓
Sentinel Agent (execute isolation command)
  ↓
Confirmation & Audit Log
```

**Backend Implementation:**

```python
# services/strike_module/strike_orchestrator.py
class StrikeOrchestrator:
    """
    Orchestrates automated response actions
    """
    
    async def isolate_endpoint(self, endpoint_id: str, 
                               initiated_by: str) -> ActionResult:
        """
        Isolate endpoint from network
        
        Steps:
        1. Validate user permissions
        2. Get endpoint connection details
        3. Send isolation command to Sentinel
        4. Wait for confirmation
        5. Log action in audit trail
        6. Notify team
        """
        # Check permissions
        if not user_has_permission(initiated_by, "isolate"):
            raise PermissionError()
        
        # Send command to agent
        result = await sentinel_api.send_command(
            endpoint_id=endpoint_id,
            command="network_isolate",
            params={"mode": "full"}
        )
        
        # Audit log
        await log_action(
            action="isolate_endpoint",
            endpoint=endpoint_id,
            user=initiated_by,
            result=result
        )
        
        return result
```

**Sentinel Agent Updates:**

```python
# voltaxe_sentinel/response_handler.py
class ResponseHandler:
    """
    Executes response actions on endpoint
    """
    
    def network_isolate(self):
        """Disable all network interfaces except management"""
        if platform.system() == "Linux":
            subprocess.run(["iptables", "-P", "INPUT", "DROP"])
            subprocess.run(["iptables", "-P", "OUTPUT", "DROP"])
            # Keep management interface for reversal
            subprocess.run(["iptables", "-A", "OUTPUT", 
                          "-d", "clarity-hub-api", "-j", "ACCEPT"])
    
    def quarantine_file(self, file_path: str):
        """Move file to quarantine directory"""
        shutil.move(file_path, "/var/voltaxe/quarantine/")
    
    def kill_process(self, pid: int):
        """Terminate malicious process"""
        os.kill(pid, signal.SIGKILL)
```

**UI Enhancements:**

```typescript
// Update EndpointDetailPage.tsx
Add:
- "Isolate Endpoint" button (red, prominent)
- Confirmation modal with impact warning
- Undo isolation button
- Action history timeline
```

---

## 💼 Phase 3: Business & Operational Features

### 3.1 Notification System Integration 🔜 PLANNED
**Priority:** HIGH
**Estimated Time:** 12-16 hours

**Email Notifications (SendGrid):**

```python
# services/notification_service/email_notifier.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailNotifier:
    def send_critical_alert(self, alert: Alert, recipients: List[str]):
        message = Mail(
            from_email='alerts@voltaxe.com',
            to_emails=recipients,
            subject=f'🚨 CRITICAL: {alert.type} on {alert.hostname}',
            html_content=self.render_template('critical_alert.html', alert)
        )
        
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        sg.send(message)
```

**Browser Push Notifications:**

```typescript
// utils/pushNotifications.ts
export class PushNotificationManager {
  async requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      this.subscribeToNotifications();
    }
  }
  
  showNotification(title: string, options: NotificationOptions) {
    new Notification(title, {
      icon: '/voltaxe-icon.png',
      badge: '/voltaxe-badge.png',
      ...options
    });
  }
}
```

**Settings Integration:**
- Make notification toggles in SettingsPage functional
- Add notification preferences per alert type
- Test mode for notification delivery

---

### 3.2 Audit Logging System 🔜 PLANNED
**Priority:** MEDIUM
**Estimated Time:** 8-10 hours

**Database Schema:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) -- success, failed, partial
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

**Backend Middleware:**

```python
# clarity_hub_api/middleware/audit_middleware.py
@app.middleware("http")
async def audit_logger(request: Request, call_next):
    user = get_current_user(request)
    
    response = await call_next(request)
    
    if request.method in ["POST", "PUT", "DELETE"]:
        await log_audit_event(
            user_id=user.id,
            action=f"{request.method} {request.url.path}",
            resource_type=extract_resource_type(request),
            details=await request.json(),
            ip_address=request.client.host
        )
    
    return response
```

**Audit Log Page:**

```typescript
// pages/AuditLogPage.tsx
Features:
- Searchable table of all actions
- Filter by: user, action type, date range
- Export to CSV for compliance
- Real-time updates for new actions
- Detailed view modal
```

---

## 📅 Recommended Implementation Timeline

### **Week 1-2: Foundation**
- ✅ Complete Team Management backend API
- ✅ Integrate Team Management into app
- ✅ Build Global Search functionality
- ✅ Create Add Endpoint page

### **Week 3-4: Intelligence Layer**
- Build Resilience Score calculator
- Implement Incident Correlation
- Create Axon Engine dashboard

### **Week 5-6: Automation**
- Build Strike Module
- Integrate endpoint isolation
- Add automated response rules

### **Week 7-8: Business Features**
- Email notification integration
- Push notification system
- Audit logging system
- Custom report scheduling

---

## 🛠️ Technical Stack Requirements

### **New Dependencies:**

**Backend:**
```bash
pip install sendgrid         # Email notifications
pip install twilio           # SMS alerts (optional)
pip install apscheduler      # Scheduled tasks/reports
pip install python-jose      # JWT for agent tokens
pip install cryptography     # Encryption for sensitive data
```

**Frontend:**
```bash
npm install @headlessui/react   # Modals, dialogs
npm install react-hot-toast     # Toast notifications
npm install recharts            # Advanced charts for resilience score
npm install react-query         # Better API state management
```

---

## 🔐 Security Considerations

1. **Role-Based Access Control (RBAC)**
   - Admin: Full access
   - Analyst: Cannot modify team or settings
   - Viewer: Read-only, no actions

2. **Agent Security**
   - TLS-only communication
   - Certificate pinning
   - Token rotation every 24 hours

3. **Audit Trail**
   - Immutable logs
   - Cryptographic signatures
   - Compliance export (SOC 2, ISO 27001)

4. **Data Protection**
   - Encrypt sensitive fields
   - PII anonymization options
   - GDPR compliance controls

---

## 📊 Success Metrics

### **Product Metrics:**
- User Engagement: Daily active users, session duration
- Feature Adoption: % using automated responses, custom reports
- Time to Resolution: Average alert → resolution time
- System Coverage: Endpoints monitored / total endpoints

### **Business Metrics:**
- Customer Retention Rate
- Feature Request Completion
- Support Ticket Reduction
- NPS Score

---

## 🎯 Next Immediate Actions

**Priority Order:**
1. ✅ **Test enhanced PDF reports** - Generate report and verify improvements
2. 🔄 **Complete Team Management** - Add routes, test invite flow
3. 🔄 **Build Global Search** - Critical for UX
4. 🔄 **Add Endpoint Flow** - Makes onboarding seamless
5. 🔄 **Resilience Score** - Your key differentiator

Would you like me to proceed with implementing **Global Search** next, or would you prefer to focus on completing the **Team Management backend API** first?
