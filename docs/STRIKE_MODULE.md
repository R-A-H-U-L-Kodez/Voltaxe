# Strike Module - Automated Response System

## Overview
The Strike Module is the automated response component of Voltaxe CRaaS (Cyber Resilience-as-a-Service). It enables automated security actions in response to threats, completing the detection → response loop.

## Architecture

```
┌──────────────────┐
│  Clarity Hub UI  │ (User clicks "Isolate Endpoint")
└────────┬─────────┘
         │ HTTP POST
         ▼
┌──────────────────────┐
│  Clarity Hub API     │
│  /endpoints/{host}/  │
│       isolate        │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Strike Orchestrator │ (Python async module)
│  - Validates action  │
│  - Logs audit trail  │
│  - Sends command     │
└────────┬─────────────┘
         │ HTTP POST :9090/command
         ▼
┌──────────────────────┐
│  Voltaxe Sentinel    │ (Go agent on endpoint)
│  Command Receiver    │
│  - Executes action   │
│  - Returns result    │
└──────────────────────┘
         │
         ▼
    Network Isolation
    (iptables/netsh)
```

## Components

### 1. Strike Orchestrator (`strike_orchestrator.py`)
**Location**: `services/clarity_hub_api/strike_orchestrator.py`

**Responsibilities**:
- Manage automated response actions
- Communicate with Sentinel agents
- Log security actions for audit trail
- Handle timeouts and failures

**Key Methods**:
```python
async def isolate_endpoint(hostname, initiated_by, reason)
async def restore_endpoint(hostname, initiated_by)
```

**Features**:
- Async operation for non-blocking execution
- Timeout protection (30 seconds default)
- Comprehensive audit logging
- Sentinel registry management

### 2. Clarity Hub API Integration
**Location**: `services/clarity_hub_api/main.py`

**Endpoint**: `POST /endpoints/{hostname}/isolate`

**Authentication**: Required (JWT token)

**Request Flow**:
1. Verify user authentication
2. Check endpoint exists in database
3. Call Strike Orchestrator
4. Return success/failure response

**Response**:
```json
{
  "status": "success",
  "message": "Endpoint 'kali' has been successfully isolated",
  "hostname": "kali",
  "action": "isolate",
  "timestamp": "2025-10-05T13:37:49Z"
}
```

### 3. Sentinel Command Receiver
**Location**: `services/voltaxe_sentinel/main.go`

**Command Server**: Listens on port `9090`

**Supported Commands**:
- `network_isolate` - Disconnect endpoint from network
- `network_restore` - Restore network connectivity
- `kill_process` - Terminate suspicious process
- `collect_forensics` - Gather forensic data

**Platform Support**:
- **Linux**: iptables rules (DROP all INPUT/OUTPUT/FORWARD)
- **Windows**: netsh interface disable
- **macOS**: networksetup commands

**Example Command**:
```json
{
  "command": "network_isolate",
  "params": {
    "hostname": "kali",
    "initiated_by": "admin",
    "reason": "Security threat detected",
    "timestamp": "2025-10-05T13:37:49Z"
  }
}
```

### 4. Frontend Integration
**Location**: `services/clarity_hub_ui/src/pages/EndpointDetailPage.tsx`

**UI Flow**:
1. User clicks "Isolate Endpoint" button
2. Confirmation modal appears
3. On confirm, calls `/endpoints/{hostname}/isolate`
4. Shows success/error notification
5. Updates endpoint status

**Code**:
```typescript
const handleIsolateEndpoint = async () => {
  const result = await endpointService.isolateEndpoint(hostname);
  // Show success notification
};
```

## Security Features

### 1. Authentication & Authorization
- JWT token required for all actions
- User identity logged in audit trail
- Permission checks (can be extended)

### 2. Audit Trail
All actions logged with:
- Timestamp
- Initiating user
- Target hostname
- Action type
- Result (success/failure)
- Reason for action

### 3. Failsafes
- Timeout protection (30s)
- Connection error handling
- Sentinel availability checks
- Database transaction safety

## Usage

### Isolate an Endpoint
```bash
# Via API
curl -X POST http://localhost/api/endpoints/kali/isolate \
  -H "Authorization: Bearer $TOKEN"

# Via UI
1. Navigate to Endpoint Detail page
2. Click "Isolate Endpoint" button
3. Confirm action in modal
```

### Check Sentinel Status
```bash
curl http://localhost:9090/status
```

### Restore Network Access
```python
# Add to strike_orchestrator
result = await strike_orchestrator.restore_endpoint(
    hostname="kali",
    initiated_by="admin"
)
```

## Deployment

### Requirements
- Python 3.11+ (API)
- Go 1.21+ (Sentinel)
- httpx library (async HTTP)
- sudo/admin privileges (for network commands)

### Configuration
1. Register Sentinels in Strike Orchestrator
2. Ensure Sentinel is running on port 9090
3. Configure firewall to allow API → Sentinel communication

### Testing
```bash
# Test Sentinel command receiver
curl -X POST http://localhost:9090/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "network_isolate",
    "params": {
      "hostname": "kali",
      "initiated_by": "test",
      "reason": "Testing Strike Module"
    }
  }'

# Check isolation status
curl http://localhost:9090/status
```

## Future Enhancements

### Planned Features
1. **Multi-action workflows**: Chain multiple actions
2. **Automated triggers**: Auto-isolate on critical alerts
3. **Rollback support**: Automatic restoration after investigation
4. **Advanced forensics**: Memory dump collection
5. **Notification system**: Alert security team on actions
6. **RBAC**: Role-based action permissions
7. **Action history**: Track all automated responses

### Integration Points
- SIEM systems (Splunk, ELK)
- Ticketing (Jira, ServiceNow)
- Communication (Slack, PagerDuty)
- Compliance reporting

## Troubleshooting

### Endpoint Won't Isolate
1. Check Sentinel is running: `curl http://localhost:9090/status`
2. Verify network connectivity: API → Sentinel
3. Check Sentinel logs: `tail -f sentinel.log`
4. Ensure sudo permissions for network commands

### Timeouts
- Increase `action_timeout` in Strike Orchestrator
- Check network latency
- Verify Sentinel responsiveness

### Audit Log Issues
- Check database connectivity
- Verify log file permissions
- Review error logs in API

## Security Considerations

### Production Deployment
1. Use HTTPS for all communication
2. Implement certificate pinning (API ↔ Sentinel)
3. Store Sentinel registry in encrypted database
4. Enable MFA for isolation actions
5. Implement rate limiting
6. Use dedicated service accounts
7. Encrypt audit logs

### Compliance
- SOC 2: Audit trail requirement ✅
- GDPR: User action tracking ✅
- HIPAA: Security response logging ✅
- PCI DSS: Automated incident response ✅

## Metrics & Monitoring

### Key Metrics
- Actions per hour/day
- Success/failure rate
- Average response time
- Endpoint isolation duration
- False positive rate

### Alerts
- Failed isolation attempts
- Sentinel unavailability
- Unauthorized access attempts
- Timeout threshold exceeded

---

**Version**: 2.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-10-05
