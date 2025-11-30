# 🚀 Phase 1 Quick Start Guide

**Goal:** Get Layer 1 (Anomaly Detection) working in 3 days

---

## Day 0: Setup & Start Collection

### Step 1: Update Agent to Send Process Snapshots

The agent code needs a small modification to send process lists every 5 minutes.

**Quick Implementation (Add to `services/voltaxe_sentinel/main.go`):**

```go
// Add this struct near the top with other structs
type ProcessSnapshot struct {
    Hostname  string   `json:"hostname"`
    Timestamp string   `json:"timestamp"`
    Processes []string `json:"processes"`
}

// Add this function
func collectProcessSnapshot() ProcessSnapshot {
    hostname, _ := os.Hostname()
    processes, _ := process.Processes()
    
    var processNames []string
    for _, p := range processes {
        name, err := p.Name()
        if err == nil {
            processNames = append(processNames, name)
        }
    }
    
    return ProcessSnapshot{
        Hostname:  hostname,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
        Processes: processNames,
    }
}

// Add this goroutine starter
func startProcessSnapshotSender() {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()
    
    // Send immediately on startup
    snapshot := collectProcessSnapshot()
    data, _ := json.Marshal(snapshot)
    sendDataToServer(data, "/ingest/process-snapshot")
    fmt.Printf("[SNAPSHOT] Sent %d processes\n", len(snapshot.Processes))
    
    // Then every 5 minutes
    for range ticker.C {
        snapshot := collectProcessSnapshot()
        data, _ := json.Marshal(snapshot)
        sendDataToServer(data, "/ingest/process-snapshot")
        fmt.Printf("[SNAPSHOT] Sent %d processes at %s\n", 
                   len(snapshot.Processes), snapshot.Timestamp)
    }
}

// Update main() function - add this line after existing goroutines
func main() {
    // ... existing code ...
    
    // NEW: Start process snapshot sender
    go startProcessSnapshotSender()
    
    // ... rest of code ...
}
```

### Step 2: Add API Endpoint

**Add to `services/clarity_hub_api/main.py`:**

```python
from pydantic import BaseModel
from typing import List

# Add this model
class ProcessSnapshot(BaseModel):
    hostname: str
    timestamp: str
    processes: List[str]

# Add this database model (with other models)
class ProcessSnapshotDB(Base):
    __tablename__ = "process_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    process_name = Column(String, index=True)
    snapshot_id = Column(String, index=True)

# Add this endpoint
@app.post("/ingest/process-snapshot")
async def ingest_process_snapshot(snapshot: ProcessSnapshot):
    """Store process snapshot for ML training"""
    try:
        db = SessionLocal()
        snapshot_id = f"{snapshot.hostname}_{snapshot.timestamp}"
        
        # Store each process as separate row
        for process_name in snapshot.processes:
            db_entry = ProcessSnapshotDB(
                hostname=snapshot.hostname,
                timestamp=datetime.fromisoformat(snapshot.timestamp.replace('Z', '+00:00')),
                process_name=process_name,
                snapshot_id=snapshot_id
            )
            db.add(db_entry)
        
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "message": f"Stored {len(snapshot.processes)} processes",
            "snapshot_id": snapshot_id
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

### Step 3: Deploy & Test

```bash
# Rebuild agent
cd services/voltaxe_sentinel
go build -o voltaxe_sentinel
sudo ./voltaxe_sentinel

# Restart API (if needed)
docker-compose restart api

# Test endpoint manually
curl -X POST http://localhost:8000/ingest/process-snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "test-laptop",
    "timestamp": "2025-11-30T10:00:00Z",
    "processes": ["chrome", "firefox", "python", "bash"]
  }'

# Expected response:
# {"status":"success","message":"Stored 4 processes","snapshot_id":"test-laptop_2025-11-30T10:00:00Z"}
```

---

## Day 1 & Day 2: Let it Collect Data

### Check Collection Status

Run this script multiple times to monitor progress:

```bash
cd services/axon_engine
python collect_training_data.py
```

**Expected Output:**
```
==================================================================
📊 TRAINING DATA COLLECTION STATUS
==================================================================

📈 Data Statistics:
   Total records: 1,234
   Unique snapshots: 145
   Unique processes: 87
   Unique hosts: 1

⏰ Time Range:
   Oldest snapshot: 2025-11-30 08:00:00
   Newest snapshot: 2025-12-01 14:30:00
   Duration: 1 day, 6:30:00
   Hours of data: 30.5

⏳ NOT READY FOR TRAINING YET
==================================================================

   Required: 48 hours of data
   Current:  30.5 hours
   Remaining: 17.5 hours

   Estimated ready: 2025-12-02 08:00
==================================================================
```

### What to Look For

✅ **Collection Rate**: Should see ~12 snapshots per hour (every 5 minutes)  
✅ **Process Count**: Should see 50-150 unique processes depending on your system  
✅ **No Errors**: Agent should be running without crashes

### Troubleshooting

**Problem: "No data collected yet"**
- Check agent is running: `ps aux | grep voltaxe_sentinel`
- Check API is accessible: `curl http://localhost:8000/health`
- Check agent logs for errors

**Problem: "Collection rate is low"**
- Agent might be crashing - check logs
- Timer might not be working - verify Go code
- API might be rejecting requests - check API logs

---

## Day 3: Train & Deploy Model

### Step 1: Train the Model

```bash
cd services/axon_engine
python train_anomaly_layer1.py
```

**Expected Output:**
```
======================================================================
🚀 VOLTAXE PHASE 1: ANOMALY DETECTION MODEL TRAINING
======================================================================

📊 Collecting training data from last 2 days...
✅ Found 3,456 process records

🔢 Calculating process frequencies...
✅ Calculated frequencies for 124 processes
📊 Total snapshots: 288

🔝 Top 10 most common processes:
   chrome: 0.986 (98.6%)
   bash: 0.972 (97.2%)
   python3: 0.854 (85.4%)
   ...

⚠️  10 rarest processes:
   ncat: 0.0035 (0.35%)
   wireshark: 0.0069 (0.69%)
   ...

🧠 Training Isolation Forest model...
[Parallel(n_jobs=1)]: Done 100 out of 100 | elapsed:    0.2s finished
✅ Model trained successfully

🧪 Testing model on example processes:
   chrome               (freq=0.9861): ✅ NORMAL
   python3              (freq=0.8542): ✅ NORMAL
   bash                 (freq=0.9722): ✅ NORMAL
   ncat                 (freq=0.0035): 🚨 ANOMALY
   mimikatz             (freq=0.0000): 🚨 ANOMALY
   nc                   (freq=0.0014): 🚨 ANOMALY

📊 Test Results: 3 normal, 3 anomalies

💾 Saving model files...
✅ Saved:
   - anomaly_model.joblib
   - process_frequencies.joblib

📦 Model size: 1.24 MB
📦 Frequency dict size: 0.08 MB
📦 Total size: 1.32 MB

======================================================================
✅ PHASE 1 MODEL TRAINING COMPLETE!
======================================================================

📋 Next Steps:
   1. Restart Axon Engine to load new model:
      docker-compose restart axon-engine
   2. Monitor ml_detections table for alerts
   3. Test with rare processes (ncat, mimikatz)
```

### Step 2: Deploy Model

```bash
# Restart Axon Engine to load new model
cd /home/rahul/Voltaxe
docker-compose restart axon-engine

# Check logs to verify model loaded
docker-compose logs axon-engine | grep -i "layer1"

# Expected:
# [INFO] layer1_loaded model=anomaly_detection
```

### Step 3: Test Detection

**Test 1: Run a rare process**
```bash
# On the endpoint being monitored:
ncat -l 4444

# Or:
nc -l 4444

# Wait 1-2 minutes for detection
```

**Test 2: Check for alerts**
```bash
# Query ml_detections table
curl http://localhost:8000/ml/detections?type=ANOMALY \
  -H "Authorization: Bearer <your_token>"
```

**Expected Alert:**
```json
{
  "total": 1,
  "detections": [
    {
      "id": 1,
      "hostname": "laptop-01",
      "detection_type": "ANOMALY",
      "process_name": "ncat",
      "confidence": 0.85,
      "timestamp": "2025-12-02T10:15:23Z",
      "action_taken": "ALERT",
      "details": {
        "type": "ANOMALY",
        "process": "ncat",
        "frequency": 0.0035,
        "confidence": 0.85
      }
    }
  ]
}
```

---

## Validation Checklist

✅ **Data Collection Works**
- Agent sends snapshots every 5 minutes
- API stores data in database
- Can see data with `collect_training_data.py`

✅ **Model Training Works**
- Script runs without errors
- Creates `.joblib` files
- Model size < 2MB
- Test predictions look correct

✅ **Detection Works**
- Axon Engine loads model
- Rare processes trigger alerts
- Common processes don't trigger alerts
- Alerts stored in database

✅ **Dashboard Shows Alerts**
- Can see ML detections in UI
- Alert details are correct
- Can filter by detection type

---

## Tuning Parameters

### If Too Many False Positives

Edit `train_anomaly_layer1.py` and change contamination:

```python
# More strict (fewer alerts)
model = IsolationForest(
    n_estimators=100,
    contamination=0.005,  # Changed from 0.01
    random_state=42
)
```

### If Missing Real Threats

```python
# More sensitive (more alerts)
model = IsolationForest(
    n_estimators=100,
    contamination=0.02,  # Changed from 0.01
    random_state=42
)
```

Then retrain:
```bash
python train_anomaly_layer1.py
docker-compose restart axon-engine
```

---

## Success Metrics

### Day 0 (Setup)
- ✅ Agent sends first snapshot
- ✅ API accepts and stores data
- ✅ No errors in logs

### Day 2 (Collection)
- ✅ 48+ hours of data collected
- ✅ 500+ snapshots in database
- ✅ 50+ unique processes tracked

### Day 3 (Training)
- ✅ Model trains successfully
- ✅ Model size < 2MB
- ✅ Test predictions correct
- ✅ Axon Engine loads model
- ✅ Real-time detection works

### Week 1 (Production)
- ✅ < 5% false positive rate
- ✅ Detects ncat, mimikatz, etc.
- ✅ No performance issues
- ✅ Dashboard shows alerts

---

## Next Steps After Phase 1

Once Phase 1 is stable and working:

1. **Document Results**
   - Update `ML_MODELS_DOCUMENTATION.md`
   - Add actual metrics and screenshots
   - Document any tuning done

2. **Monitor Performance**
   - Track false positive rate
   - Collect feedback from real alerts
   - Retrain weekly with new data

3. **Prepare for Phase 2**
   - Start planning network flow capture
   - Research libpcap vs eBPF for Go
   - Download CICIDS2017 dataset

4. **Share with Investors**
   - Show working anomaly detection
   - Demonstrate real-time alerts
   - Explain the technical advantage

---

## Support

**Issues?** Check:
- Agent logs: `./voltaxe_sentinel` output
- API logs: `docker-compose logs api`
- Axon logs: `docker-compose logs axon-engine`
- Database: `sqlite3 voltaxe_clarity.db`

**Questions?** Review:
- `PHASE1_IMPLEMENTATION_PLAN.md`
- `ML_MODELS_DOCUMENTATION.md`
- `IDPS_TECHNICAL_DEEPDIVE.md`

---

**Good luck! 🚀**

This is the foundation of your ML detection system. Take your time, collect good data, and validate thoroughly before moving to Phase 2.
