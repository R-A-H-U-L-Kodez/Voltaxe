#!/usr/bin/env python3
"""
Check training data collection status
Shows how much data has been collected and when ready for training
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import pandas as pd
import os
import sys

# Database setup - PostgreSQL only
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ CRITICAL: DATABASE_URL environment variable not set!")
    print("   PostgreSQL is required (no SQLite support)")
    sys.exit(1)

if not DATABASE_URL.startswith("postgresql://"):
    print(f"❌ CRITICAL: Only PostgreSQL is supported!")
    print(f"   Current database: {DATABASE_URL.split('://')[0]}")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_table_exists():
    """Check if process_snapshots table exists (PostgreSQL compatible)"""
    db = SessionLocal()
    try:
        # PostgreSQL-compatible query
        result = db.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'process_snapshots')"
        ))
        exists = result.scalar()
        db.close()
        return exists
    except Exception as e:
        print(f"❌ Error checking table: {e}")
        db.close()
        return False

def check_data_status():
    """Check how much training data we have"""
    
    if not check_table_exists():
        print("=" * 70)
        print("❌ TABLE 'process_snapshots' DOES NOT EXIST")
        print("=" * 70)
        print("\n💡 The table will be created automatically when:")
        print("   1. The API receives first process snapshot")
        print("   2. Make sure the agent is running and sending data")
        print("\n📋 Next Steps:")
        print("   1. Start/restart the Voltaxe Sentinel agent")
        print("   2. Wait 5 minutes for first snapshot")
        print("   3. Run this script again")
        print()
        return
    
    db = SessionLocal()
    
    # Query all snapshots
    try:
        query = "SELECT * FROM process_snapshots ORDER BY timestamp DESC LIMIT 10000"
        df = pd.read_sql(query, engine)
    except Exception as e:
        print(f"❌ Error querying data: {e}")
        db.close()
        return
    
    if len(df) == 0:
        print("=" * 70)
        print("⏳ NO TRAINING DATA COLLECTED YET")
        print("=" * 70)
        print("\n💡 Make sure:")
        print("   1. The Voltaxe Sentinel agent is running")
        print("   2. Agent is configured with correct API endpoint")
        print("   3. API server is accepting requests")
        print("\n🧪 Test Data Collection:")
        print('   curl -X POST http://localhost:8000/ingest/process-snapshot \\')
        print('     -H "Content-Type: application/json" \\')
        print('     -d \'{"hostname":"test","timestamp":"2025-11-30T10:00:00Z","processes":["chrome","firefox"]}\'')
        print()
        db.close()
        return
    
    # Calculate stats
    total_records = len(df)
    unique_snapshots = df['snapshot_id'].nunique()
    unique_processes = df['process_name'].nunique()
    unique_hosts = df['hostname'].nunique()
    
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    oldest = df['timestamp'].min()
    newest = df['timestamp'].max()
    duration = newest - oldest
    
    print("=" * 70)
    print("📊 TRAINING DATA COLLECTION STATUS")
    print("=" * 70)
    print(f"\n📈 Data Statistics:")
    print(f"   Total records: {total_records:,}")
    print(f"   Unique snapshots: {unique_snapshots:,}")
    print(f"   Unique processes: {unique_processes:,}")
    print(f"   Unique hosts: {unique_hosts}")
    print(f"\n⏰ Time Range:")
    print(f"   Oldest snapshot: {oldest}")
    print(f"   Newest snapshot: {newest}")
    print(f"   Duration: {duration}")
    
    # Calculate hours
    hours = duration.total_seconds() / 3600
    print(f"   Hours of data: {hours:.1f}")
    
    # Show top processes
    print(f"\n🔝 Top 10 Most Common Processes:")
    top_processes = df.groupby('process_name').size().sort_values(ascending=False).head(10)
    for proc, count in top_processes.items():
        pct = (count / total_records) * 100
        print(f"   {proc:30s} {count:6,} records ({pct:5.1f}%)")
    
    # Show snapshots per hour
    df['hour'] = df['timestamp'].dt.floor('H')
    snapshots_per_hour = df.groupby('hour')['snapshot_id'].nunique()
    avg_per_hour = snapshots_per_hour.mean()
    print(f"\n📊 Collection Rate:")
    print(f"   Average snapshots/hour: {avg_per_hour:.1f}")
    print(f"   Expected (every 5min): 12")
    
    if avg_per_hour < 10:
        print(f"   ⚠️  Collection rate is low! Check agent is running")
    
    # Check if ready for training
    print("\n" + "=" * 70)
    if hours < 48:
        print("⏳ NOT READY FOR TRAINING YET")
        print("=" * 70)
        print(f"\n   Required: 48 hours of data")
        print(f"   Current:  {hours:.1f} hours")
        print(f"   Remaining: {48 - hours:.1f} hours")
        
        # Estimate completion time
        if hours > 0:
            completion = newest + timedelta(hours=(48 - hours))
            print(f"\n   Estimated ready: {completion.strftime('%Y-%m-%d %H:%M')}")
    else:
        print("✅ READY FOR TRAINING!")
        print("=" * 70)
        print(f"\n   You have {hours:.1f} hours of data")
        print(f"   Minimum required: 48 hours ✓")
        print("\n📋 Next Step:")
        print("   cd services/axon_engine")
        print("   python train_anomaly_layer1.py")
    
    print("=" * 70)
    print()
    
    db.close()

if __name__ == "__main__":
    check_data_status()
