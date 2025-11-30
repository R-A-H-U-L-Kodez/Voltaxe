#!/usr/bin/env python3
"""
🕵️‍♂️ Anomaly Audit Script
-------------------------
Shows exactly which processes the ML model flagged as suspicious.
This helps verify if the model is smart (catching real threats) or stupid (flagging normal things).
"""

import os
import sys
import joblib
import pandas as pd
import re
from sqlalchemy import create_engine
from collections import Counter

# Database connection - PostgreSQL only
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ CRITICAL: DATABASE_URL environment variable not set!")
    print("   PostgreSQL is required (no SQLite support in production)")
    sys.exit(1)

if not DATABASE_URL.startswith("postgresql://"):
    print(f"❌ CRITICAL: Only PostgreSQL is supported!")
    print(f"   Current database: {DATABASE_URL.split('://')[0]}")
    sys.exit(1)

db = create_engine(DATABASE_URL)

# Model paths
MODEL_DIR = "/app/models"
ANOMALY_MODEL_PATH = f"{MODEL_DIR}/anomaly_model.joblib"
FREQ_MODEL_PATH = f"{MODEL_DIR}/process_frequencies.joblib"

print("=" * 70)
print("🕵️‍♂️  ANOMALY AUDIT REPORT")
print("=" * 70)
print()

def normalize_process_name(name):
    """Normalize process names (same logic as training)."""
    if not name:
        return 'unknown'
    
    name_lower = name.lower()
    
    if name.startswith('kworker/'):
        return 'kworker'
    
    if 'chrome' in name_lower or 'chromium' in name_lower:
        if 'crashpad' in name_lower:
            return 'chrome_crashpad'
        return 'chrome'
    
    if 'firefox' in name_lower:
        return 'firefox'
    
    if 'docker' in name_lower:
        if 'proxy' in name_lower:
            return 'docker-proxy'
        if 'containerd' in name_lower:
            return 'containerd'
        return 'docker'
    
    if name_lower.startswith('systemd'):
        return 'systemd'
    
    name_normalized = re.sub(r'-\d+$', '', name)
    name_normalized = re.sub(r'\.\d+$', '', name_normalized)
    
    return name_normalized

# Load the trained model
print("📂 Loading trained model...")
try:
    model = joblib.load(ANOMALY_MODEL_PATH)
    frequencies = joblib.load(FREQ_MODEL_PATH)
    print(f"✅ Model loaded: {ANOMALY_MODEL_PATH}")
    print(f"✅ Frequencies loaded: {FREQ_MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

print()

# Load the data
print("📊 Loading process snapshot data...")
query = """
SELECT 
    hostname,
    process_name,
    timestamp,
    snapshot_id
FROM process_snapshots
ORDER BY timestamp ASC
"""

try:
    df = pd.read_sql(query, db)
    
    # Store original and apply normalization
    df['process_name_original'] = df['process_name']
    df['process_name'] = df['process_name'].apply(normalize_process_name)
    
    print(f"✅ Loaded {len(df):,} records")
    print(f"   📅 Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"   🖥️  Hosts: {df['hostname'].nunique()}")
    print(f"   ⚙️  Unique processes (normalized): {df['process_name'].nunique()}")
except Exception as e:
    print(f"❌ Error loading data: {e}")
    exit(1)

print()

# Engineer features (same as training)
print("⚙️  Engineering features...")
df['process_frequency_score'] = df['process_name'].map(
    lambda x: frequencies.get(x, 100.0)
)
df['timestamp'] = pd.to_datetime(df['timestamp'])
df['hour'] = df['timestamp'].dt.hour
df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
df['is_weekend'] = (df['timestamp'].dt.dayofweek >= 5).astype(int)
df['snapshot_age_minutes'] = (df['timestamp'].max() - df['timestamp']).dt.total_seconds() / 60

# Predict anomalies
print("🔮 Running anomaly detection...")
feature_columns = ['process_frequency_score', 'is_night', 'is_weekend', 'snapshot_age_minutes']
X = df[feature_columns].fillna(0)
predictions = model.predict(X)
anomaly_scores = model.decision_function(X)

df['anomaly'] = predictions
df['anomaly_score'] = anomaly_scores

print()

# Statistics
normal_count = (predictions == 1).sum()
anomaly_count = (predictions == -1).sum()
anomaly_rate = (anomaly_count / len(df)) * 100

print("=" * 70)
print("📊 DETECTION STATISTICS")
print("=" * 70)
print(f"✅ Normal processes: {normal_count:,} ({100-anomaly_rate:.2f}%)")
print(f"🚨 Anomalous processes: {anomaly_count:,} ({anomaly_rate:.2f}%)")
print()

# Show the accused
suspects = df[df['anomaly'] == -1].copy()
unique_suspects = suspects['process_name'].unique()

print("=" * 70)
print(f"🚨 THE ACCUSED ({len(unique_suspects)} unique processes)")
print("=" * 70)

# Count how many times each suspect appears
suspect_counts = Counter(suspects['process_name'])

# Sort by frequency score (rarest = most suspicious)
suspect_details = []
for process in unique_suspects:
    freq_score = frequencies.get(process, 100.0)
    count = suspect_counts[process]
    avg_anomaly_score = suspects[suspects['process_name'] == process]['anomaly_score'].mean()
    suspect_details.append({
        'process': process,
        'count': count,
        'freq_score': freq_score,
        'avg_anomaly_score': avg_anomaly_score
    })

# Sort by anomaly score (most anomalous first)
suspect_details.sort(key=lambda x: x['avg_anomaly_score'])

print()
print("Ranked by suspiciousness (most suspicious first):")
print()
print(f"{'Rank':<6} {'Process':<40} {'Detections':<12} {'Freq Score':<12} {'Anomaly Score':<15}")
print("-" * 95)

for i, suspect in enumerate(suspect_details, 1):
    # Add emoji indicators
    if suspect['freq_score'] > 200:
        indicator = "🔴 RARE"
    elif suspect['freq_score'] > 100:
        indicator = "🟡 UNCOMMON"
    else:
        indicator = "🟢 COMMON"
    
    print(f"{i:<6} {suspect['process']:<40} {suspect['count']:<12} {suspect['freq_score']:<12.2f} {suspect['avg_anomaly_score']:<15.3f} {indicator}")

print()
print("=" * 70)
print("🎯 VERDICT ANALYSIS")
print("=" * 70)

# Categorize suspects
very_rare = [s for s in suspect_details if s['freq_score'] > 200]
uncommon = [s for s in suspect_details if 100 < s['freq_score'] <= 200]
common = [s for s in suspect_details if s['freq_score'] <= 100]

print(f"🔴 Very Rare Processes (freq > 200): {len(very_rare)}")
if very_rare:
    print("   These are LEGITIMATELY SUSPICIOUS (rarely seen):")
    for s in very_rare[:10]:  # Show top 10
        print(f"      • {s['process']}")

print()
print(f"🟡 Uncommon Processes (freq 100-200): {len(uncommon)}")
if uncommon:
    print("   These are MODERATELY SUSPICIOUS:")
    for s in uncommon[:10]:  # Show top 10
        print(f"      • {s['process']}")

print()
print(f"🟢 Common Processes (freq < 100): {len(common)}")
if common:
    print("   ⚠️  FALSE POSITIVES - Model thinks these normal things are suspicious:")
    for s in common[:10]:  # Show top 10
        print(f"      • {s['process']}")

print()
print("=" * 70)
print("🧠 MODEL INTELLIGENCE ASSESSMENT")
print("=" * 70)

# Calculate smart vs stupid ratio
if anomaly_count > 0:
    smart_ratio = (len(very_rare) + len(uncommon)) / len(unique_suspects) * 100
    false_positive_ratio = len(common) / len(unique_suspects) * 100
    
    print(f"✅ Smart Detections: {smart_ratio:.1f}% (rare/uncommon processes)")
    print(f"❌ False Positives: {false_positive_ratio:.1f}% (common processes)")
    print()
    
    if smart_ratio > 70:
        verdict = "🎓 INTELLIGENT - Model is mostly catching rare/suspicious processes"
    elif smart_ratio > 40:
        verdict = "🤔 LEARNING - Model is decent but needs more training data"
    else:
        verdict = "🤡 STUPID - Model is flagging too many normal processes"
    
    print(f"Final Verdict: {verdict}")
else:
    print("⚠️  No anomalies detected - Model might be too permissive")

print()
print("=" * 70)
print("💡 NEXT STEPS")
print("=" * 70)
print("1. Review the 'VERY RARE' processes - are they legitimate threats?")
print("2. If you see common processes flagged, the model needs more data")
print("3. Wait 5 hours for more data collection, then retrain")
print("4. After 24-48 hours, the model will be much smarter")
print("=" * 70)
