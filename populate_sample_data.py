#!/usr/bin/env python3
"""
Voltaxe Sample Data Population Script
Populates the dashboard with sample monitoring data for demonstration
"""

import requests
import json
import datetime
import time
import os

# API endpoint
API_BASE = "http://localhost:8000"

def create_sample_snapshot():
    """Create a sample system snapshot"""
    snapshot_data = {
        "hostname": "workstation-01.voltaxe.local",
        "os": "Ubuntu 22.04.3 LTS",
        "architecture": "x86_64",
        "hardware_info": {
            "platform": "Ubuntu 22.04",
            "cpu_model": "Intel Core i7-13700K CPU @ 3.40GHz",
            "total_ram_gb": 32,
            "total_cores": 16
        },
        "processes": [
            {"pid": 1234, "name": "systemd"},
            {"pid": 5678, "name": "docker"},
            {"pid": 9101, "name": "chrome"},
            {"pid": 1121, "name": "vscode"},
            {"pid": 3141, "name": "python3"}
        ],
        "installed_software": [
            {"name": "Google Chrome", "version": "128.0.6613.119"},
            {"name": "VS Code", "version": "1.92.0"},
            {"name": "Docker Desktop", "version": "4.28.0"},
            {"name": "Python", "version": "3.11.0"},
            {"name": "Node.js", "version": "18.17.1"}
        ]
    }
    
    try:
        response = requests.post(f"{API_BASE}/ingest/snapshot", json=snapshot_data)
        if response.status_code == 200:
            print("✅ Sample snapshot created successfully")
            return True
        else:
            print(f"❌ Failed to create snapshot: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error creating snapshot: {e}")
        return False

def create_sample_events():
    """Create sample security events"""
    events = [
        {
            "hostname": "workstation-01.voltaxe.local",
            "event_type": "VULNERABILITY_DETECTED",
            "vulnerable_software": {"name": "Docker Desktop", "version": "4.28.0"},
            "reason": "Installed version 4.28.0 is known to be vulnerable.",
            "cve": "CVE-2024-12345"
        },
        {
            "hostname": "workstation-01.voltaxe.local",
            "event_type": "SUSPICIOUS_PARENT_CHILD_PROCESS",
            "child_process": {"pid": 7890, "name": "ping"},
            "parent_process": {"pid": 5432, "name": "zsh"}
        },
        {
            "hostname": "server-02.voltaxe.local",
            "event_type": "VULNERABILITY_DETECTED",
            "vulnerable_software": {"name": "OpenSSL", "version": "1.1.1f"},
            "reason": "Critical vulnerability affecting encryption.",
            "cve": "CVE-2023-45678"
        }
    ]
    
    success_count = 0
    for event in events:
        try:
            if event["event_type"] == "VULNERABILITY_DETECTED":
                response = requests.post(f"{API_BASE}/ingest/vulnerability_event", json=event)
            else:
                response = requests.post(f"{API_BASE}/ingest/suspicious_event", json=event)
            
            if response.status_code == 200:
                success_count += 1
                print(f"✅ Event created: {event['event_type']}")
            else:
                print(f"❌ Failed to create event: {response.status_code}")
        except Exception as e:
            print(f"❌ Error creating event: {e}")
    
    print(f"✅ Created {success_count}/{len(events)} sample events")
    return success_count > 0

def create_additional_snapshots():
    """Create additional system snapshots for different endpoints"""
    additional_hosts = [
        {
            "hostname": "server-02.voltaxe.local",
            "os": "CentOS 8",
            "architecture": "x86_64",
            "hardware_info": {
                "platform": "CentOS 8",
                "cpu_model": "AMD Ryzen 7 5800X",
                "total_ram_gb": 64,
                "total_cores": 16
            },
            "processes": [
                {"pid": 1, "name": "systemd"},
                {"pid": 234, "name": "nginx"},
                {"pid": 567, "name": "mysql"},
                {"pid": 890, "name": "redis-server"}
            ],
            "installed_software": [
                {"name": "Nginx", "version": "1.18.0"},
                {"name": "MySQL", "version": "8.0.26"},
                {"name": "Redis", "version": "6.2.6"},
                {"name": "OpenSSL", "version": "1.1.1f"}
            ]
        },
        {
            "hostname": "laptop-03.voltaxe.local", 
            "os": "Windows 11 Pro",
            "architecture": "x86_64",
            "hardware_info": {
                "platform": "Windows 11",
                "cpu_model": "Intel Core i5-12600K",
                "total_ram_gb": 16,
                "total_cores": 12
            },
            "processes": [
                {"pid": 4, "name": "System"},
                {"pid": 1024, "name": "explorer.exe"},
                {"pid": 2048, "name": "chrome.exe"},
                {"pid": 4096, "name": "Teams.exe"}
            ],
            "installed_software": [
                {"name": "Microsoft Teams", "version": "1.6.00.4472"},
                {"name": "Google Chrome", "version": "128.0.6613.119"},
                {"name": "Microsoft Office", "version": "16.0.14931.20648"},
                {"name": "Windows Defender", "version": "4.18.23090.2008"}
            ]
        }
    ]
    
    success_count = 0
    for host_data in additional_hosts:
        try:
            response = requests.post(f"{API_BASE}/ingest/snapshot", json=host_data)
            if response.status_code == 200:
                success_count += 1
                print(f"✅ Snapshot created for {host_data['hostname']}")
            else:
                print(f"❌ Failed to create snapshot for {host_data['hostname']}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error creating snapshot for {host_data['hostname']}: {e}")
    
    return success_count

def main():
    """Main function to populate sample data"""
    print("🚀 Voltaxe Clarity Hub - Sample Data Population")
    print("=" * 50)
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code != 200:
            print("❌ API is not running. Please start the backend service first.")
            return
        print("✅ API is running and accessible")
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("   Make sure the backend is running on http://localhost:8000")
        return
    
    print("\n📸 Creating system snapshots...")
    create_sample_snapshot()
    
    print("\n🌐 Creating additional endpoint snapshots...")  
    additional_count = create_additional_snapshots()
    
    print("\n🚨 Creating security events...")
    create_sample_events()
    
    print(f"\n🎉 Sample data population completed!")
    print(f"   📊 Total endpoints: {1 + additional_count}")
    print(f"   🔍 Security events: Created")
    print(f"   💾 CVE database: Available")
    print("\n🌐 Refresh your browser to see the populated dashboard!")
    print(f"   Frontend: http://localhost:5173")
    print(f"   API Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()