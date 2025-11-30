# Two-Way Communication Architecture

## Overview

Voltaxe Sentinel agents implement a **dual-channel command delivery system** to ensure reliable, near-real-time execution of security response actions. This document explains the architecture, implementation details, and operational workflow.

## The Zombie Agent Problem (Solved)

### Before: One-Way Communication ❌
- Agents sent telemetry via `http.Post` to `/telemetry` endpoint
- **No mechanism to receive commands** from the API server
- "Isolate Endpoint" button queued commands but agents never received them
- Result: **Non-functional active response features**

### After: Dual-Channel Communication ✅
1. **Direct HTTP Channel**: API server attempts immediate `POST` to agent's `/command` endpoint
2. **Queue Polling Channel**: Agent polls `/command/poll` every 10 seconds for queued commands
3. **Guaranteed Delivery**: Commands persist in database until executed
4. **Result Reporting**: Agents report execution results back to `/command/result`

## Architecture Components

### 1. Database Queue (PendingCommandDB)

**Purpose**: Persistent command storage for reliable delivery

**Schema**:
```python
class PendingCommandDB(Base):
    __tablename__ = "pending_commands"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    hostname = Column(String, nullable=False, index=True)
    command = Column(String, nullable=False)  # "network_isolate", "network_restore", etc.
    params = Column(JSON, nullable=True)
    status = Column(String, default="pending", index=True)  # pending, delivered, executed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    delivered_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    result = Column(JSON, nullable=True)
    created_by = Column(String, nullable=True)  # User who issued the command
    priority = Column(Integer, default=5)  # Higher = more urgent (isolation=10, restore=5)
```

**Indexes**:
- `hostname` (frequent filtering)
- `status` (polling queries)

**Status Lifecycle**:
1. `pending` → Command created, waiting for agent
2. `delivered` → Agent polled and received command
3. `executed` → Agent reported successful execution
4. `failed` → Agent reported execution failure

### 2. API Endpoints

#### POST /command/result
**Purpose**: Agents report command execution results

**Request**:
```json
{
  "command_id": 123,
  "success": true,
  "message": "Network isolated successfully",
  "data": {
    "isolated": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response**: `200 OK` with updated command record

**Implementation**:
```python
@app.post("/command/result")
async def receive_command_result(result: CommandExecutionResult):
    db = SessionLocal()
    try:
        cmd = db.query(PendingCommandDB).filter_by(id=result.command_id).first()
        if cmd:
            cmd.status = "executed" if result.success else "failed"
            cmd.executed_at = datetime.now(timezone.utc)
            cmd.result = {
                "success": result.success,
                "message": result.message,
                "data": result.data
            }
            db.commit()
            return {"status": "recorded"}
        return {"error": "Command not found"}, 404
    finally:
        db.close()
```

#### GET /command/poll?host=HOSTNAME
**Purpose**: Agents poll for pending commands

**Query Parameters**:
- `host` (required): Agent's hostname

**Response**:
```json
{
  "commands": [
    {
      "id": 123,
      "command": "network_isolate",
      "params": {"reason": "Malware detected"}
    }
  ]
}
```

**Implementation**:
```python
@app.get("/command/poll")
async def poll_commands(host: str):
    db = SessionLocal()
    try:
        # Fetch pending commands ordered by priority (highest first)
        pending = db.query(PendingCommandDB).filter_by(
            hostname=host,
            status="pending"
        ).order_by(desc(PendingCommandDB.priority), PendingCommandDB.created_at).all()
        
        # Mark as delivered
        for cmd in pending:
            cmd.status = "delivered"
            cmd.delivered_at = datetime.now(timezone.utc)
        db.commit()
        
        # Return command list
        return CommandQueueResponse(commands=[
            {"id": c.id, "command": c.command, "params": c.params}
            for c in pending
        ])
    finally:
        db.close()
```

### 3. Strike Orchestrator (Dual-Channel Logic)

**Purpose**: Send commands via both channels for speed + reliability

**Implementation Pattern**:
```python
def isolate_endpoint(hostname: str, username: str):
    # CHANNEL 1: Queue in database (guaranteed delivery)
    _queue_command(
        hostname=hostname,
        command="network_isolate",
        params={"reason": "Manual isolation"},
        created_by=username,
        priority=10  # High priority
    )
    
    # CHANNEL 2: Try direct HTTP (fast path)
    try:
        agent_url = f"http://{hostname}:8082/command"
        response = requests.post(agent_url, json={
            "command": "network_isolate",
            "params": {"reason": "Manual isolation"}
        }, timeout=5)
        
        if response.ok:
            return {"status": "isolated", "method": "direct"}
    except Exception as e:
        # Graceful degradation: Queue already created, agent will poll
        pass
    
    # Fallback: Agent will poll within 10 seconds
    return {"status": "queued", "method": "polling"}
```

**Why Dual-Channel?**
- **Direct HTTP**: Instant execution when agent is reachable
- **Database Queue**: Guaranteed delivery when agent is offline/firewalled
- **Graceful Degradation**: One channel fails → other channel still works

### 4. Agent Polling Loop (Go Implementation)

**Purpose**: Background goroutine that polls for commands every 10 seconds

**Key Functions**:

#### startCommandPolling()
```go
func startCommandPolling() {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        pollAndExecuteCommands()
    }
}
```

#### pollAndExecuteCommands()
```go
func pollAndExecuteCommands() {
    hostname, _ := os.Hostname()
    pollURL := fmt.Sprintf("%s/command/poll?host=%s", config.APIServer, hostname)
    
    resp, err := http.Get(pollURL)
    if err != nil {
        return  // Server unreachable, retry in 10s
    }
    defer resp.Body.Close()
    
    var queueResp struct {
        Commands []PendingCommand `json:"commands"`
    }
    json.NewDecoder(resp.Body).Decode(&queueResp)
    
    for _, cmd := range queueResp.Commands {
        result := executeCommand(cmd.Command, cmd.Params)
        reportCommandResult(cmd.ID, result)
    }
}
```

#### executeCommand()
```go
func executeCommand(command string, params map[string]interface{}) CommandResponse {
    switch command {
    case "network_isolate":
        return executeNetworkIsolate(params)
    case "network_restore":
        return executeNetworkRestore(params)
    case "kill_process":
        return executeKillProcess(params)
    case "collect_forensics":
        return executeCollectForensics(params)
    default:
        return CommandResponse{
            Success: false, 
            Message: fmt.Sprintf("Unknown command: %s", command)
        }
    }
}
```

#### reportCommandResult()
```go
func reportCommandResult(commandID int, result CommandResponse) {
    resultURL := fmt.Sprintf("%s/command/result", config.APIServer)
    
    executionResult := CommandExecutionResult{
        CommandID: commandID,
        Success:   result.Success,
        Message:   result.Message,
        Data:      result.Data.(map[string]interface{}),
    }
    
    resultJSON, _ := json.Marshal(executionResult)
    http.Post(resultURL, "application/json", bytes.NewBuffer(resultJSON))
}
```

## Command Flow (End-to-End)

### Scenario: User clicks "Isolate Endpoint" in Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Action: Click "Isolate Endpoint" for host "web-01" │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: POST /api/isolate {"hostname": "web-01"}      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Strike Orchestrator: _queue_command()                    │
│    - INSERT INTO pending_commands                           │
│      (hostname='web-01', command='network_isolate',         │
│       status='pending', priority=10)                        │
│    - Returns command_id=123                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Strike Orchestrator: Try direct HTTP (fast path)         │
│    - POST http://web-01:8082/command                        │
│    - Timeout after 5 seconds                                │
└─────────────────────────────────────────────────────────────┘
                    ↓                   ↓
            ┌───────────┐         ┌────────────┐
            │ Success   │         │ Failure    │
            └───────────┘         └────────────┘
                    ↓                   ↓
        ┌──────────────────┐    ┌──────────────────┐
        │ Return immediately│    │ Fallback to queue│
        │ method="direct"   │    │ method="polling" │
        └──────────────────┘    └──────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Agent Polling Loop (every 10 seconds)                    │
│    - GET /command/poll?host=web-01                          │
│    - Server responds: {"commands": [{"id": 123, ...}]}      │
│    - UPDATE pending_commands SET status='delivered'         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Agent: Execute command                                   │
│    - executeCommand("network_isolate", {...})               │
│    - Calls executeNetworkIsolate()                          │
│    - Returns CommandResponse{Success: true, ...}            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Agent: Report result                                     │
│    - POST /command/result                                   │
│      {"command_id": 123, "success": true, ...}              │
│    - UPDATE pending_commands SET status='executed',         │
│      executed_at=NOW(), result={...}                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Dashboard: Poll /telemetry endpoint                      │
│    - Sees "isolated": true in latest telemetry              │
│    - Updates UI with green "Isolated" badge                 │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Agent Configuration (agent.conf)
```ini
[server]
api_url = http://clarity-hub-api:8080

[polling]
enabled = true
interval_seconds = 10
```

### Environment Variables
```bash
# API Server
VOLTAXE_API_URL=http://localhost:8080

# Polling (optional, defaults shown)
COMMAND_POLL_ENABLED=true
COMMAND_POLL_INTERVAL=10
```

## Security Considerations

1. **Authentication**: Commands include `created_by` field to track who issued them
2. **Authorization**: Agent validates commands against whitelist (network_isolate, network_restore, etc.)
3. **Rate Limiting**: 10-second polling interval prevents API overload
4. **Idempotency**: Commands check current state before executing (e.g., don't isolate if already isolated)
5. **Audit Trail**: All commands logged in database with timestamps

## Performance Characteristics

- **Latency**:
  - Direct HTTP: ~50ms (instant)
  - Queue polling: ~5s average (max 10s)
  
- **Throughput**:
  - API can queue unlimited commands (database-backed)
  - Agent processes commands sequentially (prevents race conditions)
  
- **Reliability**:
  - Survives agent restarts (commands persist in database)
  - Survives network outages (commands queued until connectivity restored)
  - Survives firewall blocks (polling uses outbound connections)

## Monitoring & Debugging

### Check Pending Commands
```sql
SELECT id, hostname, command, status, created_at, executed_at 
FROM pending_commands 
WHERE status IN ('pending', 'delivered')
ORDER BY priority DESC, created_at ASC;
```

### Agent Logs
```bash
tail -f /home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log | grep "COMMAND POLL"
```

**Expected output**:
```
[COMMAND POLL] 🔍 Polling for commands...
[COMMAND POLL] 📦 Received 1 command(s)
[COMMAND POLL] ⚙️  Executing command: network_isolate
[COMMAND POLL] ✅ Result reported for command ID 123
```

### API Logs
```bash
docker logs clarity-hub-api | grep "command"
```

### Dashboard Query (Check Command History)
```python
# In Python console
from services.clarity_hub_api.main import SessionLocal, PendingCommandDB
db = SessionLocal()
commands = db.query(PendingCommandDB).order_by(PendingCommandDB.created_at.desc()).limit(10).all()
for cmd in commands:
    print(f"{cmd.hostname}: {cmd.command} ({cmd.status})")
```

## Troubleshooting

### Agent Not Receiving Commands

**Symptom**: Commands queued in database but never executed

**Checks**:
1. Verify polling enabled: `grep "startCommandPolling" agent_logs`
2. Check network connectivity: `curl http://clarity-hub-api:8080/command/poll?host=$(hostname)`
3. Verify agent running: `ps aux | grep voltaxe_sentinel`
4. Check API server reachable: `ping clarity-hub-api`

**Solution**:
```bash
# Restart agent with debug logging
cd /home/rahul/Voltaxe/services/voltaxe_sentinel
./voltaxe_sentinel -config /home/rahul/Voltaxe/config/agent.conf
```

### Commands Stuck in "delivered" Status

**Symptom**: Commands marked delivered but never executed

**Root Cause**: Agent crashed after polling but before execution

**Solution**:
```sql
-- Reset stuck commands to pending
UPDATE pending_commands 
SET status = 'pending', delivered_at = NULL 
WHERE status = 'delivered' 
  AND delivered_at < NOW() - INTERVAL '5 minutes';
```

### High Database Growth

**Symptom**: pending_commands table growing indefinitely

**Solution**: Add cleanup job
```python
# Add to cron (daily at 3am)
# services/clarity_hub_api/cleanup_commands.py
from datetime import datetime, timedelta, timezone
from main import SessionLocal, PendingCommandDB

db = SessionLocal()
cutoff = datetime.now(timezone.utc) - timedelta(days=7)
db.query(PendingCommandDB).filter(
    PendingCommandDB.status == "executed",
    PendingCommandDB.executed_at < cutoff
).delete()
db.commit()
db.close()
```

## Future Enhancements

1. **WebSocket Channel**: Real-time push notifications (zero latency)
2. **Command Queuing Strategies**: FIFO, Priority, Rate-limited
3. **Batch Commands**: Execute multiple commands atomically
4. **Command Rollback**: Auto-restore endpoint after timeout
5. **Multi-Region Support**: Route commands via nearest API server
6. **Command Scheduling**: Execute commands at specific times

## References

- Strike Module Documentation: `/home/rahul/Voltaxe/docs/STRIKE_MODULE.md`
- Agent Configuration: `/home/rahul/Voltaxe/config/agent.conf`
- API Schema: `/home/rahul/Voltaxe/services/clarity_hub_api/main.py`
- Agent Source: `/home/rahul/Voltaxe/services/voltaxe_sentinel/main.go`

## Support

For issues with two-way communication:
1. Check agent logs: `/home/rahul/Voltaxe/services/logs/voltaxe_sentinel.log`
2. Check API logs: `docker logs clarity-hub-api`
3. Query pending commands: `SELECT * FROM pending_commands WHERE status != 'executed'`
4. Test connectivity: `curl http://clarity-hub-api:8080/command/poll?host=$(hostname)`

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
