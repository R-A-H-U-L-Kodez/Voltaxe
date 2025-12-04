#!/usr/bin/env python3
"""
🧠 Iterative ML Training System
-------------------------------
Trains the Isolation Forest model on whatever data is available RIGHT NOW.
Retrains automatically every hour to continuously improve accuracy.

Hour 1: Trains on ~60 records (weak model, high false positives)
Hour 5: Trains on ~300 records (getting smarter)
Hour 48: Trains on ~2,800 records (fully mature)

This eliminates the "48-hour wait" - you get a working ML system TODAY!
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np
import re
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sklearn.ensemble import IsolationForest
from collections import Counter
import time

# Database connection - PostgreSQL only
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ CRITICAL: DATABASE_URL environment variable not set!")
    print("   PostgreSQL is required for ML training (no SQLite support)")
    sys.exit(1)

if not DATABASE_URL.startswith("postgresql://"):
    print(f"❌ CRITICAL: Only PostgreSQL is supported!")
    print(f"   Current database: {DATABASE_URL.split('://')[0]}")
    sys.exit(1)

db_string = DATABASE_URL

# Model paths
MODEL_DIR = "/app/models"
ANOMALY_MODEL_PATH = f"{MODEL_DIR}/anomaly_model.joblib"
FREQ_MODEL_PATH = f"{MODEL_DIR}/process_frequencies.joblib"

# Training thresholds (adjusted for iterative learning)
MIN_RECORDS = 50  # Start training with just 50 records
MIN_UNIQUE_PROCESSES = 10  # Need at least 10 different processes

def normalize_process_name(name):
    """
    Normalize process names to reduce noise and improve detection.
    
    This collapses similar processes into categories:
    - kworker/12:1, kworker/15:0 → 'kworker' (kernel workers)
    - chrome subprocess 1234, chrome subprocess 5678 → 'chrome'
    - systemd-1234 → 'systemd'
    
    Why? Without this, the model sees 50 different kworker processes
    and flags them all as "rare" when they're actually very common.
    """
    if not name:
        return 'unknown'
    
    name_lower = name.lower()
    
    # Collapse all kernel workers into one category
    if name.startswith('kworker/'):
        return 'kworker'
    
    # Collapse Chrome processes
    if 'chrome' in name_lower or 'chromium' in name_lower:
        # Keep main categories distinct
        if 'crashpad' in name_lower:
            return 'chrome_crashpad'
        return 'chrome'
    
    # Collapse Firefox processes
    if 'firefox' in name_lower:
        return 'firefox'
    
    # Collapse Docker processes
    if 'docker' in name_lower:
        if 'proxy' in name_lower:
            return 'docker-proxy'
        if 'containerd' in name_lower:
            return 'containerd'
        return 'docker'
    
    # Collapse systemd with PIDs: systemd-1234 → systemd
    if name_lower.startswith('systemd'):
        return 'systemd'
    
    # Collapse numbered variants: postgres-1 → postgres
    name_normalized = re.sub(r'-\d+$', '', name)
    
    # Collapse numbered variants: process.1 → process
    name_normalized = re.sub(r'\.\d+$', '', name_normalized)
    
    return name_normalized

def get_training_data():
    """
    Fetch process snapshots with SLIDING WINDOW (30 days).
    
    🎯 THE MAGIC: Only train on the last 30 days
    ✅ Prevents memory overflow as data grows
    ✅ Keeps model "fresh" - adapts to current behavior
    ✅ Forgets old patterns after 30 days
    
    Month 1: Fast (loads 50K records)
    Month 6: Still Fast (loads 50K records, not 10M!)
    """
    engine = create_engine(db_string)
    
    try:
        # Get process snapshot data with 30-DAY SLIDING WINDOW
        query = """
        SELECT 
            hostname,
            process_name,
            timestamp,
            snapshot_id
        FROM process_snapshots
        WHERE timestamp > NOW() - INTERVAL '30 days'  -- 🔥 THE MAGIC LINE
        ORDER BY timestamp ASC
        """
        
        df = pd.read_sql(query, engine)
        
        if len(df) == 0:
            print("❌ No data found in process_snapshots table")
            return None
        
        # Store original process names for auditing
        df['process_name_original'] = df['process_name']
        
        # Apply normalization to reduce noise
        print("🔧 Normalizing process names...")
        df['process_name'] = df['process_name'].apply(normalize_process_name)
        
        # Show normalization impact
        original_unique = df['process_name_original'].nunique()
        normalized_unique = df['process_name'].nunique()
        reduction = ((original_unique - normalized_unique) / original_unique * 100)
        
        print(f"📊 Fetched {len(df):,} records from database")
        print(f"   📅 Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"   🖥️  Hosts: {df['hostname'].nunique()}")
        print(f"   ⚙️  Unique processes (raw): {original_unique}")
        print(f"   ✨ Unique processes (normalized): {normalized_unique} ({reduction:.1f}% reduction)")
        print(f"   📸 Snapshots: {df['snapshot_id'].nunique()}")
        
        return df
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return None
    finally:
        engine.dispose()

def calculate_process_frequencies(df):
    """
    Calculate how often each process appears.
    Common processes = low score (normal)
    Rare processes = high score (suspicious)
    """
    process_counts = Counter(df['process_name'])
    total_records = len(df)
    
    # Calculate frequency score for each process
    # Score = 1 / (frequency_percentage)
    # Common process (chrome, 50% frequency) → score = 2
    # Rare process (mimikatz, 0.1% frequency) → score = 1000
    frequencies = {}
    for process, count in process_counts.items():
        freq_percent = (count / total_records) * 100
        # Inverse frequency score (higher = more rare = more suspicious)
        frequencies[process] = 100.0 / max(freq_percent, 0.01)
    
    return frequencies

def engineer_features(df, process_frequencies):
    """
    Transform raw process data into ML features.
    Creates the 'process_frequency_score' that the Isolation Forest uses.
    """
    # Add frequency score feature
    df['process_frequency_score'] = df['process_name'].map(
        lambda x: process_frequencies.get(x, 100.0)  # Default to suspicious if unknown
    )
    
    # Time-based features (hour of day)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
    df['is_weekend'] = (df['timestamp'].dt.dayofweek >= 5).astype(int)
    
    # Snapshot-based features
    df['snapshot_age_minutes'] = (df['timestamp'].max() - df['timestamp']).dt.total_seconds() / 60
    
    return df

def train_isolation_forest(df, iteration_hour):
    """
    Train Isolation Forest model on current data.
    Adjusts contamination rate based on data maturity.
    """
    # Select features for training (simplified for snapshot-only data)
    feature_columns = [
        'process_frequency_score',
        'is_night',
        'is_weekend',
        'snapshot_age_minutes'
    ]
    
    X = df[feature_columns].fillna(0)
    
    # Dynamic contamination rate based on data maturity
    # Progressive paranoia reduction as model matures:
    # Hour 1-5: contamination=0.05 (High paranoia - 5% flagged)
    # Hour 6-12: contamination=0.02 (Medium paranoia - 2% flagged)
    # Hour 12+: contamination=0.01 (Precision mode - 1% flagged)
    if iteration_hour <= 5:
        contamination = 0.05  # 5% - Very permissive for weak early model
    elif iteration_hour <= 12:
        contamination = 0.02  # 2% - TIGHTENED - Model is getting smarter
    else:
        contamination = 0.01  # 1% - Mature model, strict anomaly detection
    
    print(f"🎯 Training with contamination={contamination} (iteration hour {iteration_hour})")
    
    # Train model
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        max_samples='auto',
        n_jobs=-1  # Use all CPU cores
    )
    
    model.fit(X)
    
    # Calculate anomaly scores on training data (for validation)
    anomaly_scores = model.decision_function(X)
    predictions = model.predict(X)
    
    anomalies_detected = (predictions == -1).sum()
    anomaly_rate = (anomalies_detected / len(df)) * 100
    
    print(f"✅ Model trained on {len(df):,} records")
    print(f"   🚨 Anomalies detected: {anomalies_detected} ({anomaly_rate:.2f}%)")
    print(f"   📊 Anomaly score range: [{anomaly_scores.min():.3f}, {anomaly_scores.max():.3f}]")
    
    return model

def save_models(model, frequencies):
    """Save trained models to disk."""
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Save Isolation Forest
    joblib.dump(model, ANOMALY_MODEL_PATH)
    model_size = os.path.getsize(ANOMALY_MODEL_PATH) / 1024  # KB
    print(f"💾 Saved anomaly model: {ANOMALY_MODEL_PATH} ({model_size:.1f} KB)")
    
    # Save frequency dictionary
    joblib.dump(frequencies, FREQ_MODEL_PATH)
    freq_size = os.path.getsize(FREQ_MODEL_PATH) / 1024  # KB
    print(f"💾 Saved frequencies: {FREQ_MODEL_PATH} ({freq_size:.1f} KB)")

def get_iteration_hour(df):
    """Calculate how many hours of data we have."""
    if df is None or len(df) == 0:
        return 0
    
    time_range = pd.to_datetime(df['timestamp'].max()) - pd.to_datetime(df['timestamp'].min())
    hours = time_range.total_seconds() / 3600
    return max(1, int(hours))

def train_now(verbose=True):
    """
    Main training function - Run this to train on current data.
    Returns: (success: bool, message: str, stats: dict)
    """
    if verbose:
        print("=" * 70)
        print("🧠 ITERATIVE ML TRAINING - Starting Now")
        print("=" * 70)
        print(f"⏰ Training time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
    
    # Step 1: Get training data
    df = get_training_data()
    
    if df is None:
        return False, "No database connection", {}
    
    # Step 2: Check minimum requirements
    num_records = len(df)
    num_processes = df['process_name'].nunique()
    
    if num_records < MIN_RECORDS:
        msg = f"Not enough data yet (Need {MIN_RECORDS}, have {num_records})"
        if verbose:
            print(f"⏳ {msg}")
        return False, msg, {"records": num_records, "processes": num_processes}
    
    if num_processes < MIN_UNIQUE_PROCESSES:
        msg = f"Not enough process diversity (Need {MIN_UNIQUE_PROCESSES}, have {num_processes})"
        if verbose:
            print(f"⏳ {msg}")
        return False, msg, {"records": num_records, "processes": num_processes}
    
    # Step 3: Calculate iteration hour
    iteration_hour = get_iteration_hour(df)
    
    if verbose:
        print(f"📈 Training Iteration: Hour {iteration_hour}")
        print()
    
    # Step 4: Calculate process frequencies
    if verbose:
        print("🔢 Calculating process frequencies...")
    frequencies = calculate_process_frequencies(df)
    
    # Show top 10 most common processes
    if verbose:
        print("   Top 10 common processes:")
        sorted_freq = sorted(frequencies.items(), key=lambda x: x[1])[:10]
        for proc, score in sorted_freq:
            print(f"      • {proc}: score={score:.2f}")
        print()
    
    # Step 5: Engineer features
    if verbose:
        print("⚙️  Engineering features...")
    df_features = engineer_features(df, frequencies)
    
    # Step 6: Train model
    if verbose:
        print("🎓 Training Isolation Forest...")
    model = train_isolation_forest(df_features, iteration_hour)
    print()
    
    # Step 7: Save models
    if verbose:
        print("💾 Saving models...")
    save_models(model, frequencies)
    print()
    
    # Step 8: Success!
    stats = {
        "records": num_records,
        "processes": num_processes,
        "iteration_hour": iteration_hour,
        "model_size_kb": os.path.getsize(ANOMALY_MODEL_PATH) / 1024,
        "timestamp": datetime.now().isoformat()
    }
    
    if verbose:
        print("=" * 70)
        print("✅ TRAINING COMPLETE!")
        print("=" * 70)
        print(f"📊 Model Statistics:")
        print(f"   • Records trained: {stats['records']:,}")
        print(f"   • Unique processes: {stats['processes']}")
        print(f"   • Iteration hour: {stats['iteration_hour']}")
        print(f"   • Model size: {stats['model_size_kb']:.1f} KB")
        print()
        print("🚀 The ML system is now ACTIVE and will improve every hour!")
        print("=" * 70)
    
    return True, "Training successful", stats

def auto_retrain_loop(interval_minutes=60):
    """
    Automatic retraining loop - runs every N minutes.
    This is meant to be run as a background service.
    """
    print("🔄 Starting automatic retraining loop...")
    print(f"   Retraining every {interval_minutes} minutes")
    print()
    
    iteration = 0
    while True:
        iteration += 1
        print(f"\n{'='*70}")
        print(f"🔄 AUTO-RETRAIN #{iteration}")
        print(f"{'='*70}")
        
        success, message, stats = train_now(verbose=True)
        
        if success:
            print(f"✅ Iteration #{iteration} complete - Sleeping {interval_minutes} minutes...")
        else:
            print(f"⏳ Iteration #{iteration} skipped ({message}) - Sleeping {interval_minutes} minutes...")
        
        # Sleep until next training
        time.sleep(interval_minutes * 60)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Iterative ML Training System")
    parser.add_argument("--auto", action="store_true", help="Run in automatic retraining mode")
    parser.add_argument("--interval", type=int, default=60, help="Retraining interval in minutes (default: 60)")
    
    args = parser.parse_args()
    
    if args.auto:
        # Background service mode
        auto_retrain_loop(interval_minutes=args.interval)
    else:
        # One-time training
        success, message, stats = train_now(verbose=True)
        sys.exit(0 if success else 1)
