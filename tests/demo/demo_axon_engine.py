#!/usr/bin/env python3

"""
Voltaxe Axon Engine - Demo Script
Demonstrates the resilience scoring intelligence system

⚠️  IMPORTANT: This is a DEMO/TEST script for LOCAL DEVELOPMENT ONLY.
    - Uses SQLite for simplicity in local testing
    - NOT intended for production use
    - PRODUCTION systems MUST use PostgreSQL via docker-compose.yml
    
For production deployment, use:
    docker-compose up -d
    
This will start all services with PostgreSQL backend.
"""

import sys
import os

# Add the axon_engine directory to Python path
sys.path.insert(0, '/home/rahul/Voltaxe/Voltaxe/services/axon_engine')

from main import VoltaxeAxonEngine
from datetime import datetime, timedelta
import sqlite3

print("=" * 70)
print("⚠️  WARNING: This is a LOCAL DEMO script using SQLite")
print("   For PRODUCTION, use docker-compose with PostgreSQL")
print("=" * 70)
print()

def create_fresh_test_data():
    """Create fresh test data with recent timestamps"""
    
    print("🔄 Creating fresh test data for Axon Engine demonstration...")
    
    # Connect to database (same one Axon Engine uses)
    db_path = "/home/rahul/Voltaxe/Voltaxe/services/axon_engine/voltaxe_clarity.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get current timestamp
    current_time = datetime.utcnow()
    
    # Create fresh snapshots with recent timestamps
    test_hosts = [
        'production-server-01.voltaxe.com',
        'web-server-02.voltaxe.com', 
        'database-server-03.voltaxe.com'
    ]
    
    for i, hostname in enumerate(test_hosts):
        snapshot_time = current_time - timedelta(minutes=i*5)  # Recent timestamps
        
        cursor.execute("""
            INSERT INTO snapshots (hostname, timestamp, details) 
            VALUES (?, ?, ?)
        """, (hostname, snapshot_time, '{"os": "Linux", "version": "Ubuntu 22.04"}'))
        
        print(f"✅ Created snapshot for {hostname}")
    
    # Create vulnerability events
    vuln_events = [
        {
            'hostname': 'production-server-01.voltaxe.com',
            'event_type': 'VULNERABILITY_DETECTED',
            'details': '{"cve": "CVE-2024-1234", "severity": "HIGH", "description": "Buffer overflow vulnerability"}'
        },
        {
            'hostname': 'web-server-02.voltaxe.com', 
            'event_type': 'VULNERABILITY_DETECTED',
            'details': '{"cve": "CVE-2024-5678", "severity": "CRITICAL", "description": "Remote code execution"}'
        },
        {
            'hostname': 'production-server-01.voltaxe.com',
            'event_type': 'SUSPICIOUS_PARENT_CHILD_PROCESS',
            'details': '{"process": "suspicious_script.sh", "parent": "bash", "risk": "medium"}'
        }
    ]
    
    for event in vuln_events:
        event_time = current_time - timedelta(minutes=30)
        cursor.execute("""
            INSERT INTO events (hostname, event_type, timestamp, details)
            VALUES (?, ?, ?, ?)
        """, (event['hostname'], event['event_type'], event_time, event['details']))
        
        print(f"✅ Created {event['event_type']} event for {event['hostname']}")
    
    conn.commit()
    conn.close()
    
    print("🎯 Fresh test data created successfully!\n")

def demonstrate_axon_engine():
    """Run Axon Engine demonstration"""
    
    print("=" * 60)
    print("🔥 VOLTAXE AXON ENGINE DEMONSTRATION")
    print("=" * 60)
    print("🧠 Resilience Scoring Intelligence System")
    print("📊 Real-time Security Posture Assessment")
    print("=" * 60)
    print()
    
    # Create fresh test data
    create_fresh_test_data()
    
    # Initialize Axon Engine
    print("🚀 Initializing Voltaxe Axon Engine...")
    engine = VoltaxeAxonEngine()
    
    # Run a single scoring cycle
    print("🎯 Running resilience scoring cycle...")
    engine.run_scoring_cycle()
    
    print("\n" + "=" * 60)
    print("✅ AXON ENGINE DEMONSTRATION COMPLETED")
    print("=" * 60)
    print()
    print("🔍 Key Features Demonstrated:")
    print("   • Real-time endpoint discovery")
    print("   • Vulnerability severity analysis") 
    print("   • Behavioral pattern assessment")
    print("   • Risk categorization (LOW/MEDIUM/HIGH/CRITICAL)")
    print("   • Historical resilience metrics")
    print("   • Automated security scoring")
    print()
    print("📊 The Axon Engine provides continuous security intelligence")
    print("   to help organizations understand their security posture")
    print("   and prioritize remediation efforts based on risk scores.")
    print()

if __name__ == "__main__":
    demonstrate_axon_engine()