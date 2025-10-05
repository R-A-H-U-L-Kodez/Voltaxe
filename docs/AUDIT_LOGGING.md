# Voltaxe Audit Logging System

## Overview

The Voltaxe Audit Logging System provides comprehensive tracking of all security-critical actions and administrative activities within the platform. This feature is essential for:

- **Security Compliance** (SOC 2, ISO 27001, HIPAA, etc.)
- **Forensic Investigation** 
- **User Accountability**
- **Regulatory Requirements**
- **Incident Response**

## Features

### 📊 Comprehensive Event Tracking

The system automatically logs:

#### Authentication & Authorization
- ✅ User login (successful/failed)
- ✅ User logout
- ✅ Password changes
- ✅ Session management

#### Alert Management
- ✅ Alert acknowledgment
- ✅ Alert dismissal
- ✅ Alert escalation

#### Endpoint Management
- 🚨 **Endpoint isolation** (CRITICAL severity)
- ⚠️ **Endpoint restoration** (WARNING severity)
- ✅ Endpoint scanning
- ✅ Endpoint configuration changes

#### Threat Response
- ✅ Threat mitigation actions
- ✅ Process termination
- ✅ Forensics data collection

#### Configuration & Administration
- ✅ Settings updates
- ✅ User creation/deletion/modification
- ✅ Role changes
- ✅ Team management actions

#### Data Access & Export
- ⚠️ **Audit log exports** (WARNING severity - important to track!)
- ✅ Report generation
- ✅ Search operations
- ✅ Data exports

### 🎯 Key Capabilities

#### 1. Real-Time Logging
- All actions logged synchronously to database
- Console output with emoji indicators for visibility
- Structured JSON storage for machine parsing

#### 2. Rich Metadata
Each audit log entry includes:
- **Timestamp** (UTC)
- **User ID & Username**
- **Action Type** (enum-based categorization)
- **Action Description** (human-readable summary)
- **Severity Level** (INFO/WARNING/CRITICAL)
- **Resource Information** (type and ID)
- **Success/Failure Status**
- **Error Messages** (for failed actions)
- **Additional Details** (JSON blob for context)
- **IP Address** (when available)
- **User Agent** (when available)

#### 3. Advanced Filtering
Filter audit logs by:
- User ID
- Action type
- Resource type/ID
- Severity level
- Date range
- Full-text search

#### 4. Analytics & Reporting
- **Statistics Dashboard**: Total logs, unique users, severity breakdown
- **User Activity Reports**: Individual user behavior analysis
- **Compliance Exports**: JSON/CSV formats for auditors

#### 5. Self-Auditing (Meta-Logging)
The audit system logs access to audit logs themselves, creating a complete chain of custody for compliance requirements.

## API Endpoints

### Get Audit Logs
```http
GET /audit/logs?user_id=&action_type=&severity=&search=&limit=100&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `user_id` (optional): Filter by specific user
- `action_type` (optional): Filter by action type
- `resource_type` (optional): Filter by resource type
- `resource_id` (optional): Filter by resource ID
- `severity` (optional): info, warning, or critical
- `start_date` (optional): ISO 8601 timestamp
- `end_date` (optional): ISO 8601 timestamp
- `search` (optional): Full-text search
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "logs": [
    {
      "id": 123,
      "timestamp": "2025-10-05T14:30:00.000Z",
      "user_id": "user@voltaxe.com",
      "username": "admin@voltaxe.com",
      "action_type": "endpoint_isolated",
      "action_description": "Isolated endpoint 'kali' from network",
      "severity": "critical",
      "resource_type": "endpoint",
      "resource_id": "kali",
      "success": true,
      "details": {
        "reason": "Manual isolation requested via Clarity Hub",
        "initiated_by": "admin@voltaxe.com"
      }
    }
  ],
  "total": 523,
  "limit": 100,
  "offset": 0
}
```

### Get Audit Log Detail
```http
GET /audit/logs/{log_id}
Authorization: Bearer <token>
```

### Get Statistics
```http
GET /audit/statistics?days=30
Authorization: Bearer <token>
```

**Response:**
```json
{
  "period_days": 30,
  "total_logs": 1250,
  "unique_users": 8,
  "failed_actions": 15,
  "action_types": {
    "login": 120,
    "endpoint_isolated": 45,
    "alert_acknowledged": 200
  },
  "severity_counts": {
    "info": 980,
    "warning": 200,
    "critical": 70
  },
  "resource_types": {
    "endpoint": 150,
    "alert": 300,
    "user": 50
  }
}
```

### Get User Activity
```http
GET /audit/user-activity/{user_id}?days=30
Authorization: Bearer <token>
```

### Export Audit Logs
```http
GET /audit/export?start_date=&end_date=&format=json
Authorization: Bearer <token>
```

**Formats:** `json` or `csv`

Downloads file: `audit_logs_20251005_143000.json`

### Get Action Types
```http
GET /audit/action-types
Authorization: Bearer <token>
```

Returns all available action types and severity levels for filtering.

## Frontend UI

### Audit Logs Page

Access at: `http://localhost:3000/audit-logs`

**Features:**
- 📊 **Statistics Dashboard**: Visual cards showing total logs, active users, critical events, failed actions
- 🔍 **Advanced Search**: Full-text search across usernames, actions, resources
- 🎛️ **Filters Panel**: Multi-criteria filtering (action type, severity, resource, date range)
- 📋 **Detailed Table View**: Sortable, paginated log entries
- 🔎 **Detail Modal**: Click any log for complete information
- 📥 **Export Functions**: Download logs in JSON or CSV format

**Navigation:**
- Click "Audit Logs" in the sidebar (📄 icon)
- Or navigate to `/audit-logs`

## Usage Examples

### View Recent Critical Events
1. Go to Audit Logs page
2. Click "Filters"
3. Set Severity: "Critical"
4. Click Search

### Track User Activity
1. Open Filters panel
2. Enter user email in search box
3. Review all actions by that user

### Export Compliance Report
1. Set date range (e.g., last quarter)
2. Click "Export CSV"
3. Share with auditors

### Investigate Failed Login Attempts
1. Filter by Action Type: "Login Failed"
2. Review timestamps and IP addresses
3. Identify potential security incidents

## Database Schema

**Table:** `audit_logs`

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    username VARCHAR(255),
    action_type VARCHAR(100),
    action_description TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    details JSON,
    success VARCHAR(5) DEFAULT 'true',
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_user_id ON audit_logs(user_id);
CREATE INDEX idx_username ON audit_logs(username);
CREATE INDEX idx_action_type ON audit_logs(action_type);
CREATE INDEX idx_severity ON audit_logs(severity);
CREATE INDEX idx_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_resource_id ON audit_logs(resource_id);
```

## Action Types

### Authentication
- `login` - User logged in successfully
- `logout` - User logged out
- `login_failed` - Failed login attempt
- `password_change` - User changed password

### Alerts
- `alert_acknowledged` - User acknowledged alert
- `alert_dismissed` - User dismissed alert
- `alert_escalated` - Alert escalated

### Endpoints
- `endpoint_isolated` - Endpoint isolated from network
- `endpoint_restored` - Endpoint network access restored
- `endpoint_scanned` - Endpoint security scan performed

### Threats
- `threat_mitigated` - Threat successfully mitigated
- `process_killed` - Malicious process terminated
- `forensics_collected` - Forensic data collected

### Configuration
- `settings_updated` - System settings modified
- `user_created` - New user account created
- `user_deleted` - User account deleted
- `user_updated` - User account modified
- `role_changed` - User role/permissions changed

### Data Access
- `data_exported` - Data exported/downloaded
- `report_generated` - Report generated
- `search_performed` - Search operation executed

### System
- `system_update` - System configuration updated
- `backup_created` - Backup created
- `backup_restored` - Backup restored

## Severity Levels

### 🚨 CRITICAL
Used for security-critical actions:
- Endpoint isolation
- Threat mitigation
- Unauthorized access attempts
- Data breaches
- System compromises

### ⚠️ WARNING  
Used for important administrative actions:
- Endpoint restoration
- Configuration changes
- User deletions
- Data exports
- Failed actions

### ℹ️ INFO
Used for routine operations:
- Successful logins
- Report generation
- Searches
- Alert acknowledgments
- General system activity

## Compliance & Security

### Regulatory Compliance
The audit logging system supports:
- **SOC 2 Type II**: Complete audit trail of all user actions
- **ISO 27001**: Information security management evidence
- **HIPAA**: Healthcare data access logging
- **GDPR**: Data access and modification tracking
- **PCI DSS**: Security event monitoring

### Security Features
- ✅ **Immutable Logs**: Cannot be modified or deleted via API
- ✅ **Tamper Detection**: Timestamped entries with unique IDs
- ✅ **Access Control**: Requires authentication to view
- ✅ **Meta-Logging**: Audit log access is itself audited
- ✅ **Retention**: Logs stored indefinitely for compliance

### Best Practices
1. **Regular Reviews**: Check audit logs weekly for anomalies
2. **Export Backups**: Monthly exports for long-term retention
3. **Alert on Critical**: Set up notifications for critical events
4. **Investigate Failures**: Review all failed actions
5. **User Training**: Educate team that all actions are logged

## Integration Examples

### Automatic Logging in Code

The audit service is automatically integrated into critical endpoints:

```python
# Example: Endpoint Isolation
@app.post("/endpoints/{hostname}/isolate")
async def isolate_endpoint(hostname: str, current_user: dict):
    result = await strike_orchestrator.isolate_endpoint(hostname)
    
    # Automatic audit logging
    audit_service.log_action(
        user_id=current_user.get("email"),
        username=current_user.get("username"),
        action_type=ActionType.ENDPOINT_ISOLATED,
        action_description=f"Isolated endpoint '{hostname}' from network",
        resource_type="endpoint",
        resource_id=hostname,
        severity=SeverityLevel.CRITICAL,
        details={"reason": "Manual isolation via Clarity Hub"}
    )
    
    return result
```

### Adding Custom Audit Logs

```python
from audit_service import audit_service, ActionType, SeverityLevel

# Log custom action
audit_service.log_action(
    user_id="admin@voltaxe.com",
    username="Admin User",
    action_type=ActionType.SETTINGS_UPDATED,
    action_description="Updated notification preferences",
    resource_type="settings",
    resource_id="notifications",
    severity=SeverityLevel.INFO,
    details={
        "changes": {
            "email_notifications": True,
            "desktop_notifications": True
        }
    }
)
```

## Performance Considerations

- **Database**: SQLite used for simplicity (upgrade to PostgreSQL for production)
- **Indexing**: All key fields indexed for fast queries
- **Pagination**: Default 100 logs per page to manage large datasets
- **Async Operations**: Logging doesn't block main request flow
- **Retention**: Consider archiving logs older than 1-2 years

## Troubleshooting

### Issue: Logs not appearing
**Solution:** Check that audit_service is imported and initialized in main.py

### Issue: Slow queries with many logs
**Solution:** Ensure database indexes exist, use pagination, filter by date range

### Issue: Exports timing out
**Solution:** Reduce date range, export in batches

### Issue: Missing user information
**Solution:** Verify JWT token includes user_id and email claims

## Future Enhancements

Potential additions:
- 📊 Real-time audit log streaming (WebSocket)
- 🔔 Alerting on suspicious patterns
- 🤖 ML-based anomaly detection
- 📈 Advanced analytics dashboard
- 🔗 SIEM integration (Splunk, ELK)
- 📧 Scheduled compliance reports
- 🔐 Log encryption at rest
- ☁️ Cloud backup integration

## Summary

The Voltaxe Audit Logging System provides enterprise-grade tracking of all platform activities, essential for:
- ✅ Security compliance requirements
- ✅ Forensic investigations
- ✅ User accountability
- ✅ Regulatory audits
- ✅ Incident response

**Access the Audit Logs page now at:** `http://localhost:3000/audit-logs`

All critical actions (endpoint isolation, restoration, login attempts, etc.) are automatically logged with complete metadata for comprehensive security oversight.
