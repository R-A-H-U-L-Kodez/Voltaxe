#!/usr/bin/env python3
"""
Voltaxe Phase 1: Anomaly Detection Model Training
Train Isolation Forest on collected process snapshots
"""

import joblib
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import os
import sys

# Database setup
DB_PATH = os.path.join(os.path.dirname(__file__), "../../voltaxe_clarity.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"
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
    
    if len(snapshots) == 0:
        return None
    
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
    
    return process_frequencies, total_snapshots

def train_isolation_forest(process_frequencies, contamination=0.01):
    """Train Isolation Forest model"""
    print("\n🧠 Training Isolation Forest model...")
    print(f"   Contamination: {contamination} (expect {contamination*100}% anomalies)")
    
    # Prepare training data
    X = pd.DataFrame({'frequency': list(process_frequencies.values())})
    
    # Train model
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        verbose=1
    )
    
    model.fit(X)
    print("✅ Model trained successfully")
    
    # Test on some examples
    print("\n🧪 Testing model on example processes:")
    test_cases = [
        ("chrome", process_frequencies.get("chrome", 0)),
        ("chrome.exe", process_frequencies.get("chrome.exe", 0)),
        ("firefox", process_frequencies.get("firefox", 0)),
        ("python", process_frequencies.get("python", 0)),
        ("python3", process_frequencies.get("python3", 0)),
        ("bash", process_frequencies.get("bash", 0)),
        ("ncat", process_frequencies.get("ncat", 0.0001)),
        ("nc", process_frequencies.get("nc", 0.0001)),
        ("mimikatz", process_frequencies.get("mimikatz", 0)),
        ("reverse_shell", process_frequencies.get("reverse_shell", 0))
    ]
    
    normal_count = 0
    anomaly_count = 0
    
    for proc_name, freq in test_cases:
        prediction = model.predict([[freq]])[0]
        if prediction == -1:
            status = "🚨 ANOMALY"
            anomaly_count += 1
        else:
            status = "✅ NORMAL"
            normal_count += 1
        print(f"   {proc_name:20s} (freq={freq:.4f}): {status}")
    
    print(f"\n📊 Test Results: {normal_count} normal, {anomaly_count} anomalies")
    
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
    print(f"📦 Total size: {model_size + freq_size:.2f} MB")

def main():
    print("=" * 70)
    print("🚀 VOLTAXE PHASE 1: ANOMALY DETECTION MODEL TRAINING")
    print("=" * 70)
    print()
    
    # Step 1: Collect data
    df = collect_training_data(days=2)
    
    if df is None or len(df) < 100:
        print("\n❌ ERROR: Not enough training data")
        print(f"   Found: {len(df) if df is not None else 0} records")
        print(f"   Need: At least 100 records (2 days of snapshots)")
        print("\n💡 Solution:")
        print("   1. Make sure the agent is running")
        print("   2. Wait for 2 days to collect data")
        print("   3. Run: python collect_training_data.py (to check status)")
        sys.exit(1)
    
    # Step 2: Calculate frequencies
    process_frequencies, total_snapshots = calculate_frequencies(df)
    
    # Step 3: Train model
    model = train_isolation_forest(process_frequencies)
    
    # Step 4: Save model
    save_model(model, process_frequencies)
    
    print("\n" + "=" * 70)
    print("✅ PHASE 1 MODEL TRAINING COMPLETE!")
    print("=" * 70)
    print("\n📋 Next Steps:")
    print("   1. Restart Axon Engine to load new model:")
    print("      docker-compose restart axon-engine")
    print("   2. Monitor ml_detections table for alerts")
    print("   3. Test with rare processes (ncat, mimikatz)")
    print("\n📊 Training Summary:")
    print(f"   - Processes tracked: {len(process_frequencies)}")
    print(f"   - Snapshots analyzed: {total_snapshots}")
    print(f"   - Model ready: Yes")
    print()

if __name__ == "__main__":
    main()
