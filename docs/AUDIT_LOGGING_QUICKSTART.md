# Voltaxe Audit Logging - Quick Start Guide

## 🎯 What is Audit Logging?

The Audit Logging system tracks **every security-critical action** in Voltaxe:
- Who did it
- What they did  
- When they did it
- Whether it succeeded or failed

Essential for **compliance** (SOC 2, ISO 27001, HIPAA, GDPR) and **security investigations**.

## 🚀 Quick Access

**Frontend:** http://localhost:3000/audit-logs

**API Endpoint:** GET http://localhost:8000/audit/logs

## 📋 What Gets Logged?

### 🔐 Authentication
- ✅ Login (success/failure)
- ✅ Logout
- ✅ Password changes

### 🚨 Security Actions
- 🚨 **Endpoint isolation** (CRITICAL)
- ⚠️ **Endpoint restoration** (WARNING)
- ✅ Threat mitigation
- ✅ Process termination

### 🎯 Alerts
- ✅ Alert acknowledgment
- ✅ Alert dismissal
- ✅ Alert escalation

### ⚙️ Configuration
- ✅ Settings changes
- ✅ User management
- ✅ Role changes

### 📊 Data Access
- ⚠️ **Data exports** (WARNING)
- ✅ Report generation
- ✅ Search operations

## 🎨 UI Features

### Statistics Dashboard
```
┌─────────────────────────────────────────┐
│ Total Logs    Active Users    Critical  │
│   1,250            8            70      │
└─────────────────────────────────────────┘
```

### Search & Filter
- 🔍 Full-text search
- 📅 Date range filter
- 🎯 Action type filter
- ⚠️ Severity filter
- 📦 Resource type filter

### Actions
- 📥 Export as JSON
- 📥 Export as CSV
- 🔎 View log details
- ⏪⏩ Pagination

## 🔍 Common Searches

### View Critical Events Only
1. Click "Filters"
2. Set Severity = "Critical"
3. Click Search

**Shows:** Endpoint isolations, security incidents, access violations

### Find User Activity
1. Enter user email in search box
2. Press Enter

**Shows:** All actions by that user

### Investigate Failed Logins
1. Click "Filters"
2. Set Action Type = "Login Failed"
3. Click Search

**Shows:** Failed authentication attempts with timestamps and IP addresses

### Export for Compliance Audit
1. Set date range (Start Date → End Date)
2. Click "Export CSV"
3. Download and share with auditors

**Downloads:** `audit_logs_20251005_143000.csv`

## 📊 Understanding Severity Levels

| Severity | Icon | Color | When Used |
|----------|------|-------|-----------|
| **CRITICAL** | 🚨 | Red | Endpoint isolation, threats, breaches |
| **WARNING** | ⚠️ | Orange | Restoration, config changes, exports |
| **INFO** | ℹ️ | Blue | Login, reports, routine actions |

## 🔔 Example Audit Logs

### Endpoint Isolation (Critical)
```
🚨 Oct 5, 2:30 PM
User: admin@voltaxe.com
Action: Isolated endpoint 'kali' from network
Resource: endpoint:kali
Status: ✅ Success
```

### Failed Login (Warning)
```
⚠️ Oct 5, 2:25 PM
User: unknown@example.com
Action: Failed login attempt: Invalid credentials
Status: ❌ Failed
```

### Settings Update (Info)
```
ℹ️ Oct 5, 2:20 PM
User: admin@voltaxe.com
Action: Updated notification preferences
Resource: settings:notifications
Status: ✅ Success
```

## 🛠️ API Usage

### Get Recent Logs
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/audit/logs?limit=50"
```

### Filter by User
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/audit/logs?user_id=admin@voltaxe.com"
```

### Get Statistics
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/audit/statistics?days=30"
```

### Export Logs
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/audit/export?format=csv" > audit_logs.csv
```

## 🎯 Best Practices

### Daily Tasks
1. ✅ Review critical events
2. ✅ Check for failed login attempts
3. ✅ Monitor user activity

### Weekly Tasks
1. ✅ Generate statistics report
2. ✅ Export logs for backup
3. ✅ Review unusual patterns

### Monthly Tasks
1. ✅ Compliance export (CSV)
2. ✅ Share with security team
3. ✅ Archive old logs

## 🔐 Security Features

- ✅ **Immutable**: Logs cannot be deleted or modified
- ✅ **Authenticated**: Only authorized users can view
- ✅ **Meta-Logged**: Viewing logs is itself logged
- ✅ **Tamper-Proof**: Timestamped with unique IDs

## 🧩 Integration

### Automatic Logging

These actions are **automatically logged**:
- ✅ User login/logout
- ✅ Endpoint isolation/restoration
- ✅ Alert actions
- ✅ YARA rule updates
- ✅ Any authenticated API request

### Manual Logging (for developers)

```python
from audit_service import audit_service, ActionType, SeverityLevel

audit_service.log_action(
    user_id="admin@voltaxe.com",
    username="Admin User",
    action_type=ActionType.SETTINGS_UPDATED,
    action_description="Updated email settings",
    resource_type="settings",
    resource_id="email",
    severity=SeverityLevel.INFO,
    details={"smtp_enabled": True}
)
```

## 📚 Documentation

- **Full Docs:** `/docs/AUDIT_LOGGING.md`
- **Summary:** `/docs/AUDIT_LOGGING_SUMMARY.md`
- **This Guide:** `/docs/AUDIT_LOGGING_QUICKSTART.md`

## 🆘 Troubleshooting

### Logs not appearing?
- Check authentication (JWT token)
- Verify endpoint is instrumented with audit logging
- Check API logs: `docker-compose logs api | grep AUDIT`

### Export not working?
- Ensure date range is not too large
- Check disk space
- Try JSON format first

### Slow queries?
- Use date range filter
- Reduce limit parameter
- Filter by specific user or action type

## ✅ Checklist: Using Audit Logs

- [ ] Navigate to http://localhost:3000/audit-logs
- [ ] View statistics dashboard
- [ ] Search for your own username
- [ ] Filter by severity (Critical)
- [ ] View a log detail (click any row)
- [ ] Export logs as JSON
- [ ] Export logs as CSV
- [ ] Perform an action (isolate endpoint) and verify it appears in logs

## 🎉 You're Ready!

Audit Logging is now protecting your Voltaxe platform!

**Access:** http://localhost:3000/audit-logs

**Next:** Perform some actions and watch them appear in real-time! 🚀
