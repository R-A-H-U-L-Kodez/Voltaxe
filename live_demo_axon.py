#!/usr/bin/env python3

"""
Voltaxe Axon Engine - Live Demonstration
Shows real-time resilience scoring with immediate data
"""

import sys
import os
sys.path.insert(0, '/home/rahul/Voltaxe/Voltaxe/services/axon_engine')

from datetime import datetime, timedelta
import sqlite3

def demonstrate_live_scoring():
    """Demonstrate live resilience scoring"""
    
    print("=" * 60)
    print("🔥 VOLTAXE AXON ENGINE - LIVE DEMONSTRATION")
    print("=" * 60)
    print()
    
    # Connect to the Axon Engine database
    db_path = "/home/rahul/Voltaxe/Voltaxe/services/axon_engine/voltaxe_clarity.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update existing snapshots to have recent timestamps
    current_time = datetime.utcnow()
    
    print("🔄 Updating snapshot timestamps to current time...")
    cursor.execute("""
        UPDATE snapshots 
        SET timestamp = ? 
        WHERE hostname LIKE '%voltaxe.com'
    """, (current_time,))
    
    # Update events to recent time too
    recent_time = current_time - timedelta(minutes=10)
    cursor.execute("""
        UPDATE events 
        SET timestamp = ?
        WHERE hostname LIKE '%voltaxe.com'
    """, (recent_time,))
    
    conn.commit()
    
    # Show what we have
    cursor.execute("SELECT hostname, timestamp FROM snapshots ORDER BY timestamp DESC")
    snapshots = cursor.fetchall()
    
    print("📊 Active Snapshots:")
    for hostname, timestamp in snapshots:
        print(f"   • {hostname} - {timestamp}")
    
    cursor.execute("SELECT hostname, event_type FROM events")
    events = cursor.fetchall()
    
    print("\n🚨 Security Events:")
    for hostname, event_type in events:
        print(f"   • {hostname}: {event_type}")
    
    conn.close()
    
    print("\n🎯 Now running Axon Engine with fresh data...")
    print("=" * 60)
    
    # Import and run Axon Engine
    from main import VoltaxeAxonEngine
    
    # Initialize and run one cycle
    engine = VoltaxeAxonEngine()
    engine.run_scoring_cycle()
    
    print("\n" + "=" * 60)
    print("✅ LIVE DEMONSTRATION COMPLETED")
    print("=" * 60)
    
    # Show results
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT hostname, resilience_score, risk_category 
        FROM snapshots 
        WHERE resilience_score IS NOT NULL
        ORDER BY resilience_score ASC
    """)
    
    results = cursor.fetchall()
    
    if results:
        print("\n🎯 RESILIENCE SCORES CALCULATED:")
        print("-" * 60)
        for hostname, score, risk in results:
            risk_color = "🔴" if risk == "CRITICAL" else "🟠" if risk == "HIGH" else "🟡" if risk == "MEDIUM" else "🟢"
            print(f"   {risk_color} {hostname}")
            print(f"      Score: {score}/100  |  Risk: {risk}")
            print()
    else:
        print("\n⚠️  No scores calculated yet - check logs for details")
    
    # Show metrics if any
    cursor.execute("""
        SELECT hostname, resilience_score, vulnerability_count, suspicious_events_count
        FROM resilience_metrics 
        ORDER BY timestamp DESC
        LIMIT 10
    """)
    
    metrics = cursor.fetchall()
    
    if metrics:
        print("📈 RECENT RESILIENCE METRICS:")
        print("-" * 60)
        for hostname, score, vulns, suspicious in metrics:
            print(f"   • {hostname}: Score {score}, Vulnerabilities: {vulns}, Suspicious: {suspicious}")
    
    conn.close()

if __name__ == "__main__":
    demonstrate_live_scoring()