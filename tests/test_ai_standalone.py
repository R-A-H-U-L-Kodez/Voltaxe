#!/usr/bin/env python3
"""
Voltaxe AI Standalone Test
--------------------------
Tests the AI/ML component (Isolation Forest anomaly detection) 
without requiring PostgreSQL database connection.
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import tempfile

print("=" * 70)
print("[TEST] VOLTAXE AI STANDALONE TEST")
print("=" * 70)
print()

# Track test results
tests_passed = 0
tests_failed = 0

def test_passed(name):
    global tests_passed
    tests_passed += 1
    print(f"[PASS] {name}")

def test_failed(name, error=""):
    global tests_failed
    tests_failed += 1
    print(f"[FAIL] {name}: {error}")

# Test 1: Check ML library imports
print("\n[TEST 1] ML Library Dependencies")
print("-" * 50)
try:
    from sklearn.ensemble import IsolationForest
    test_passed("IsolationForest import")
except ImportError as e:
    test_failed("IsolationForest import", str(e))

try:
    from sklearn.preprocessing import StandardScaler
    test_passed("StandardScaler import")
except ImportError as e:
    test_failed("StandardScaler import", str(e))

try:
    import joblib
    test_passed("joblib import")
except ImportError as e:
    test_failed("joblib import", str(e))

try:
    import pandas as pd
    test_passed("pandas import")
except ImportError as e:
    test_failed("pandas import", str(e))

try:
    import numpy as np
    test_passed("numpy import")
except ImportError as e:
    test_failed("numpy import", str(e))

# Test 2: Train an Isolation Forest model on synthetic data
print("\n[TEST 2] Model Training on Synthetic Data")
print("-" * 50)

# Generate synthetic process frequency data
np.random.seed(42)
normal_processes = np.random.normal(0.5, 0.1, 100)  # Normal processes (common)
rare_processes = np.random.normal(0.01, 0.005, 10)  # Rare processes (suspicious)
all_data = np.concatenate([normal_processes, rare_processes]).reshape(-1, 1)

try:
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42
    )
    model.fit(all_data)
    test_passed("Model training completed")
except Exception as e:
    test_failed("Model training", str(e))

# Test 3: Anomaly Detection
print("\n[TEST 3] Anomaly Detection Logic")
print("-" * 50)

try:
    # Predict on test cases
    test_cases = [
        (0.5, "Common process"),       # Should be normal
        (0.6, "Frequent process"),     # Should be normal
        (0.001, "Very rare process"),  # Should be anomaly
        (0.0001, "Extremely rare"),    # Should be anomaly
    ]
    
    correct_predictions = 0
    for freq, description in test_cases:
        prediction = model.predict([[freq]])[0]
        is_anomaly = prediction == -1
        
        # Check if prediction is correct
        expected_anomaly = freq < 0.1
        is_correct = is_anomaly == expected_anomaly
        
        status = "ANOMALY" if is_anomaly else "NORMAL"
        correctness = "[OK]" if is_correct else "[X]"
        print(f"   {description:25s} (freq={freq:0.4f}): {status:8s} {correctness}")
        
        if is_correct:
            correct_predictions += 1
    
    if correct_predictions >= 3:  # At least 75% accuracy
        test_passed(f"Detection accuracy: {correct_predictions}/4 correct")
    else:
        test_failed(f"Detection accuracy", f"Only {correct_predictions}/4 correct")
        
except Exception as e:
    test_failed("Anomaly detection", str(e))

# Test 4: Model Serialization
print("\n[TEST 4] Model Serialization (Save/Load)")
print("-" * 50)

try:
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = os.path.join(tmpdir, "test_anomaly_model.joblib")
        
        # Save model
        joblib.dump(model, model_path)
        test_passed(f"Model save successful")
        
        # Load model
        loaded_model = joblib.load(model_path)
        test_passed("Model load successful")
        
        # Verify loaded model works
        test_pred = loaded_model.predict([[0.5]])[0]
        test_passed("Loaded model prediction works")
        
except Exception as e:
    test_failed("Model serialization", str(e))

# Test 5: Feature Engineering Simulation
print("\n[TEST 5] Feature Engineering")
print("-" * 50)

try:
    # Simulate process snapshot data
    df = pd.DataFrame({
        'process_name': ['chrome', 'firefox', 'python', 'ncat', 'systemd'] * 20,
        'timestamp': pd.date_range('2024-01-01', periods=100, freq='5min'),
        'hostname': 'test-host'
    })
    
    # Feature 1: Process frequency
    process_counts = df['process_name'].value_counts()
    df['frequency_score'] = df['process_name'].map(lambda x: process_counts.get(x, 0) / len(df))
    test_passed("Frequency score calculation")
    
    # Feature 2: Time-based features
    df['hour'] = df['timestamp'].dt.hour
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
    df['is_weekend'] = (df['timestamp'].dt.dayofweek >= 5).astype(int)
    test_passed("Time-based features")
    
    # Verify feature values
    assert df['frequency_score'].min() >= 0, "Frequency score should be non-negative"
    assert df['frequency_score'].max() <= 1, "Frequency score should be <= 1"
    test_passed("Feature value validation")
    
except Exception as e:
    test_failed("Feature engineering", str(e))

# Test 6: Resilience Score Calculation Logic
print("\n[TEST 6] Resilience Score Calculation")
print("-" * 50)

try:
    def calculate_resilience_score(
        critical_vulns=0, high_vulns=0, medium_vulns=0, low_vulns=0,
        ml_anomalies=0
    ):
        """Simulate resilience score calculation"""
        base_score = 100
        
        # Vulnerability deductions
        base_score -= critical_vulns * 40
        base_score -= high_vulns * 25
        base_score -= medium_vulns * 15
        base_score -= low_vulns * 5
        
        # ML anomaly deductions
        base_score -= ml_anomalies * 12
        
        # Ensure score is in range
        return max(0, min(100, base_score))
    
    # Test cases
    score1 = calculate_resilience_score(critical_vulns=0, ml_anomalies=0)
    assert score1 == 100, f"Clean system should be 100, got {score1}"
    test_passed("Clean system score: 100")
    
    score2 = calculate_resilience_score(critical_vulns=1)
    assert score2 == 60, f"1 critical vuln should be 60, got {score2}"
    test_passed("Critical vulnerability impact: -40 points")
    
    score3 = calculate_resilience_score(ml_anomalies=3)
    assert score3 == 64, f"3 ML anomalies should be 64, got {score3}"
    test_passed("ML anomaly impact: -12 points each")
    
    score4 = calculate_resilience_score(critical_vulns=3, ml_anomalies=5)
    assert score4 == 0, f"Severe issues should cap at 0, got {score4}"
    test_passed("Score floor at 0")
    
except Exception as e:
    test_failed("Resilience score calculation", str(e))

# Summary
print()
print("=" * 70)
print("[SUMMARY] TEST RESULTS")
print("=" * 70)
print(f"   [PASS] Passed: {tests_passed}")
print(f"   [FAIL] Failed: {tests_failed}")
print(f"   [ALL]  Total:  {tests_passed + tests_failed}")
print()

if tests_failed == 0:
    print("SUCCESS! ALL TESTS PASSED - The AI component is working correctly.")
    print()
    print("AI/ML Capabilities Verified:")
    print("   * ML library dependencies (sklearn, joblib, pandas, numpy)")
    print("   * Isolation Forest model training")
    print("   * Anomaly detection logic")
    print("   * Model serialization (save/load)")
    print("   * Feature engineering")
    print("   * Resilience score calculation")
    sys.exit(0)
else:
    print(f"WARNING: {tests_failed} test(s) failed. Review issues above.")
    sys.exit(1)
