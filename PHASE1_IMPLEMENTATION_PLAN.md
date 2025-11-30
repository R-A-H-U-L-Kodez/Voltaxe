# 🚀 Phase 1: Anomaly Detection Implementation Plan

**Date:** November 30, 2025  
**Goal:** Implement Layer 1 (Anomaly Detection) using Isolation Forest  
**Complexity:** Low - No labeled data needed  
**Timeline:** 2-3 days for MVP

---

## 📋 Overview

Phase 1 implements the **"Unknown Unknown" detector** - catching zero-day threats and rare processes without needing attack examples. This is the foundation of Voltaxe's ML detection.

### Why Phase 1 First?

✅ **No labeled data needed** - Just run on your laptop for 2 days  
✅ **Simple agent changes** - Only process list collection  
✅ **Fast to validate** - See detections immediately  
✅ **High ROI** - Catches advanced threats like mimikatz, ncat  
✅ **Steel Thread** - Proves the ML pipeline works end-to-end

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: ANOMALY DETECTION                   │
│                                                                 │
│  1️⃣ AGENT (Go) - Data Collection                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Every 5 minutes:                                        │  │
│  │  • Get list of running processes                         │  │
│  │  • Send to server: /ingest/process-snapshot             │  │
│  │  • Format: {"hostname": "...", "processes": [...]}      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  2️⃣ SERVER (Python) - Data Storage                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Store in DB:                                            │  │
│  │  • process_snapshots table                               │  │
│  │  • Track: hostname, process_name, timestamp              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  3️⃣ TRAINING SCRIPT - Learn Normal                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  After 2 days:                                           │  │
│  │  • Calculate process frequencies                         │  │
│  │  • Train Isolation Forest                                │  │
│  │  • Save: anomaly_model.joblib                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  4️⃣ DETECTION ENGINE - Find Anomalies                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Real-time:                                              │  │
│  │  • Check each new process against model                  │  │
│  │  • If rare (< 1%) → Generate ALERT                       │  │
│  │  • Store in ml_detections table                          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Checklist

### Part 1: Agent Modifications (Go)

- [ ] **1.1**: Add process snapshot collection function
- [ ] **1.2**: Add 5-minute periodic sender goroutine
- [ ] **1.3**: Create `/ingest/process-snapshot` endpoint call
- [ ] **1.4**: Test data collection locally

**Files to modify:**
- `services/voltaxe_sentinel/main.go`

**Estimated time:** 2 hours

---

### Part 2: Server API Endpoint (Python)

- [ ] **2.1**: Create `process_snapshots` database table
- [ ] **2.2**: Add POST `/ingest/process-snapshot` endpoint
- [ ] **2.3**: Store incoming process data
- [ ] **2.4**: Test endpoint with curl

**Files to modify:**
- `services/clarity_hub_api/main.py`
- Add database migration if needed

**Estimated time:** 1 hour

---

### Part 3: Training Pipeline (Python)

- [ ] **3.1**: Create training data collection script
- [ ] **3.2**: Calculate process frequencies
- [ ] **3.3**: Train Isolation Forest model
- [ ] **3.4**: Save model files (`.joblib`)
- [ ] **3.5**: Validate model works

**New files:**
- `services/axon_engine/train_anomaly_layer1.py`
- `services/axon_engine/collect_training_data.py`

**Estimated time:** 3 hours

---

### Part 4: Detection Integration (Python)

- [ ] **4.1**: Load anomaly model in Axon Engine
- [ ] **4.2**: Add real-time anomaly checking
- [ ] **4.3**: Generate alerts for rare processes
- [ ] **4.4**: Test with known bad processes (ncat, mimikatz)

**Files to modify:**
- `services/axon_engine/main_ml_enhanced.py` (already has skeleton)

**Estimated time:** 2 hours

---

### Part 5: Testing & Validation

- [ ] **5.1**: Run agent for 2 days to collect "normal" data
- [ ] **5.2**: Train model on collected data
- [ ] **5.3**: Test detection with rare processes
- [ ] **5.4**: Tune contamination parameter if needed
- [ ] **5.5**: Document results

**Estimated time:** 2 days (mostly waiting)

---

## 🔧 Implementation Details

### 1. Agent Code (Go)

**Add to `main.go`:**

```go
// NEW: Process snapshot collection
type ProcessSnapshot struct {
    Hostname  string   `json:"hostname"`
    Timestamp string   `json:"timestamp"`
    Processes []string `json:"processes"`
}

// Collect process names only (for Phase 1)
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

// Send process snapshot every 5 minutes
func startProcessSnapshotSender() {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        snapshot := collectProcessSnapshot()
        data, _ := json.Marshal(snapshot)
        sendDataToServer(data, "/ingest/process-snapshot")
        fmt.Printf("[SNAPSHOT] Sent %d processes at %s\n", 
                   len(snapshot.Processes), snapshot.Timestamp)
    }
}

// Update main() to start snapshot sender
func main() {
    // ... existing code ...
    
    // Start process snapshot sender
    go startProcessSnapshotSender()
    
    // ... rest of code ...
}
```

---

### 2. Server API Endpoint (Python)

**Add to `clarity_hub_api/main.py`:**

```python
from pydantic import BaseModel
from typing import List

class ProcessSnapshot(BaseModel):
    hostname: str
    timestamp: str
    processes: List[str]

class ProcessSnapshotDB(Base):
    __tablename__ = "process_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    process_name = Column(String, index=True)
    snapshot_id = Column(String, index=True)  # Group processes from same snapshot

@app.post("/ingest/process-snapshot")
async def ingest_process_snapshot(snapshot: ProcessSnapshot):
    """Store process snapshot for ML training"""
    try:
        db = SessionLocal()
        snapshot_id = f"{snapshot.hostname}_{snapshot.timestamp}"
        
        # Store each process as separate row for easy frequency calculation
        for process_name in snapshot.processes:
            db_entry = ProcessSnapshotDB(
                hostname=snapshot.hostname,
                timestamp=datetime.fromisoformat(snapshot.timestamp),
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

---

### 3. Training Script (Python)

**Create `services/axon_engine/train_anomaly_layer1.py`:**

```python
#!/usr/bin/env python3
"""
Train Layer 1: Anomaly Detection Model
Requires 2+ days of process snapshot data
"""

import joblib
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import os

# Database setup
DATABASE_URL = "sqlite:///../../voltaxe_clarity.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ProcessSnapshotDB(Base):
    __tablename__ = "process_snapshots"
    id = Column(Integer, primary_key=True)
    hostname = Column(String)
    timestamp = Column(DateTime)
    process_name = Column(String)
    snapshot_id = Column(String)

def collect_training_data(days=2):
    """Collect process data from last N days"""
    print(f"📊 Collecting training data from last {days} days...")
    
    db = SessionLocal()
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all process snapshots
    snapshots = db.query(ProcessSnapshotDB).filter(
        ProcessSnapshotDB.timestamp > cutoff_date
    ).all()
    
    print(f"✅ Found {len(snapshots)} process records")
    
    # Convert to DataFrame
    data = {
        'snapshot_id': [s.snapshot_id for s in snapshots],
        'process_name': [s.process_name for s in snapshots],
        'timestamp': [s.timestamp for s in snapshots]
    }
    df = pd.DataFrame(data)
    
    db.close()
    return df

def calculate_frequencies(df):
    """Calculate how often each process appears"""
    print("🔢 Calculating process frequencies...")
    
    # Count unique snapshots
    total_snapshots = df['snapshot_id'].nunique()
    
    # Count snapshots where each process appears
    process_counts = df.groupby('process_name')['snapshot_id'].nunique()
    
    # Calculate frequency (0.0 to 1.0)
    process_frequencies = (process_counts / total_snapshots).to_dict()
    
    print(f"✅ Calculated frequencies for {len(process_frequencies)} processes")
    print(f"📊 Total snapshots: {total_snapshots}")
    
    # Show top 10 most common
    top_10 = sorted(process_frequencies.items(), key=lambda x: x[1], reverse=True)[:10]
    print("\n🔝 Top 10 most common processes:")
    for proc, freq in top_10:
        print(f"   {proc}: {freq:.3f} ({freq*100:.1f}%)")
    
    # Show bottom 10 rarest
    bottom_10 = sorted(process_frequencies.items(), key=lambda x: x[1])[:10]
    print("\n⚠️  10 rarest processes:")
    for proc, freq in bottom_10:
        print(f"   {proc}: {freq:.4f} ({freq*100:.2f}%)")
    
    return process_frequencies

def train_isolation_forest(process_frequencies):
    """Train Isolation Forest model"""
    print("\n🧠 Training Isolation Forest model...")
    
    # Prepare training data
    X = pd.DataFrame({'frequency': list(process_frequencies.values())})
    
    # Train model
    model = IsolationForest(
        n_estimators=100,
        contamination=0.01,  # Expect 1% anomalies
        random_state=42,
        verbose=1
    )
    
    model.fit(X)
    print("✅ Model trained successfully")
    
    # Test on some examples
    print("\n🧪 Testing model on example processes:")
    test_cases = [
        ("chrome.exe", process_frequencies.get("chrome.exe", 0)),
        ("explorer.exe", process_frequencies.get("explorer.exe", 0)),
        ("python", process_frequencies.get("python", 0)),
        ("ncat", process_frequencies.get("ncat", 0.0001)),
        ("mimikatz", process_frequencies.get("mimikatz", 0))
    ]
    
    for proc_name, freq in test_cases:
        prediction = model.predict([[freq]])[0]
        status = "🚨 ANOMALY" if prediction == -1 else "✅ NORMAL"
        print(f"   {proc_name} (freq={freq:.4f}): {status}")
    
    return model

def save_model(model, process_frequencies):
    """Save trained model and frequencies"""
    print("\n💾 Saving model files...")
    
    joblib.dump(model, 'anomaly_model.joblib')
    joblib.dump(process_frequencies, 'process_frequencies.joblib')
    
    print("✅ Saved:")
    print("   - anomaly_model.joblib")
    print("   - process_frequencies.joblib")
    
    # Check file sizes
    model_size = os.path.getsize('anomaly_model.joblib') / 1024 / 1024
    freq_size = os.path.getsize('process_frequencies.joblib') / 1024 / 1024
    print(f"\n📦 Model size: {model_size:.2f} MB")
    print(f"📦 Frequency dict size: {freq_size:.2f} MB")

def main():
    print("=" * 70)
    print("🚀 VOLTAXE PHASE 1: ANOMALY DETECTION MODEL TRAINING")
    print("=" * 70)
    print()
    
    # Step 1: Collect data
    df = collect_training_data(days=2)
    
    if len(df) < 100:
        print("\n❌ ERROR: Not enough training data")
        print(f"   Found: {len(df)} records")
        print(f"   Need: At least 100 records (2 days of snapshots)")
        print("\n💡 Solution: Run the agent for 2 more days to collect data")
        return
    
    # Step 2: Calculate frequencies
    process_frequencies = calculate_frequencies(df)
    
    # Step 3: Train model
    model = train_isolation_forest(process_frequencies)
    
    # Step 4: Save model
    save_model(model, process_frequencies)
    
    print("\n" + "=" * 70)
    print("✅ PHASE 1 MODEL TRAINING COMPLETE!")
    print("=" * 70)
    print("\n📋 Next Steps:")
    print("   1. Restart Axon Engine to load new model")
    print("   2. Monitor ml_detections table for alerts")
    print("   3. Test with rare processes (ncat, mimikatz)")
    print()

if __name__ == "__main__":
    main()
```

---

### 4. Data Collection Helper Script

**Create `services/axon_engine/collect_training_data.py`:**

```python
#!/usr/bin/env python3
"""
Check training data collection status
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import pandas as pd

DATABASE_URL = "sqlite:///../../voltaxe_clarity.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_data_status():
    """Check how much training data we have"""
    db = SessionLocal()
    
    # Query all snapshots
    query = "SELECT * FROM process_snapshots ORDER BY timestamp DESC LIMIT 1000"
    df = pd.read_sql(query, engine)
    
    if len(df) == 0:
        print("❌ No training data collected yet")
        print("💡 Make sure the agent is running and sending snapshots")
        return
    
    # Calculate stats
    total_records = len(df)
    unique_snapshots = df['snapshot_id'].nunique()
    unique_processes = df['process_name'].nunique()
    
    oldest = df['timestamp'].min()
    newest = df['timestamp'].max()
    duration = pd.to_datetime(newest) - pd.to_datetime(oldest)
    
    print("=" * 70)
    print("📊 TRAINING DATA STATUS")
    print("=" * 70)
    print(f"Total records: {total_records}")
    print(f"Unique snapshots: {unique_snapshots}")
    print(f"Unique processes: {unique_processes}")
    print(f"Oldest snapshot: {oldest}")
    print(f"Newest snapshot: {newest}")
    print(f"Duration: {duration}")
    print()
    
    # Check if ready for training
    hours = duration.total_seconds() / 3600
    if hours < 48:
        print(f"⏳ Not ready for training yet")
        print(f"   Need: 48 hours of data")
        print(f"   Have: {hours:.1f} hours")
        print(f"   Remaining: {48 - hours:.1f} hours")
    else:
        print(f"✅ Ready for training!")
        print(f"   Run: python train_anomaly_layer1.py")
    
    print("=" * 70)
    
    db.close()

if __name__ == "__main__":
    check_data_status()
```

---

## 📊 Testing Strategy

### Day 0: Setup
```bash
# 1. Deploy updated agent
cd services/voltaxe_sentinel
go build
sudo ./voltaxe_sentinel

# 2. Verify endpoint
curl -X POST http://localhost:8000/ingest/process-snapshot \
  -H "Content-Type: application/json" \
  -d '{"hostname":"test","timestamp":"2025-11-30T10:00:00Z","processes":["chrome","firefox"]}'

# 3. Check data collection
cd services/axon_engine
python collect_training_data.py
```

### Day 2: Training
```bash
# After 2 days of data collection
cd services/axon_engine
python train_anomaly_layer1.py

# Restart Axon Engine
docker-compose restart axon-engine
```

### Day 3: Validation
```bash
# Test with known rare process
# On endpoint, run:
ncat -l 4444

# Check for alert in dashboard
# Should see anomaly detection alert
```

---

## 🎯 Success Criteria

✅ **Data Collection**: 48+ hours of process snapshots  
✅ **Model Training**: Successfully trains Isolation Forest  
✅ **Model Size**: < 5MB total  
✅ **Detection Speed**: < 1ms per process  
✅ **Alert Generation**: Detects ncat/mimikatz as anomalies  
✅ **False Positives**: < 5% on common processes

---

## 🚨 Common Issues & Solutions

### Issue: "Not enough training data"
**Solution**: Wait longer, ensure agent is running continuously

### Issue: "Too many false positives"
**Solution**: Adjust `contamination` parameter (try 0.005 or 0.02)

### Issue: "Missing rare processes"
**Solution**: Lower contamination OR add whitelist for critical processes

### Issue: "Model doesn't load"
**Solution**: Check file paths, restart Axon Engine

---

## 📚 Phase 2 Preview

After Phase 1 is stable:
- Add network flow capture (Layer 2)
- Train Deep Neural Network
- Detect DDoS, port scans, brute force
- Full two-layer detection

**Don't start Phase 2 until Phase 1 works!**

---

## 📝 Documentation to Update

- [ ] Update `ML_MODELS_DOCUMENTATION.md` with actual results
- [ ] Add Phase 1 completion to `IDPS_TECHNICAL_DEEPDIVE.md`
- [ ] Update `VOLTAXE_USER_GUIDE.md` with training instructions

---

**Status:** Ready to implement  
**Estimated Total Time:** 8 hours coding + 2 days data collection  
**Next Action:** Start with Agent modifications (Part 1)
