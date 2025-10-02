# In: services/mock_ingestion_server/main.py
from fastapi import FastAPI, Request
import json

app = FastAPI()

@app.post("/ingest/snapshot")
async def receive_snapshot(request: Request):
    data = await request.json()
    print("\n📸 --- FULL SYSTEM SNAPSHOT Received --- 📸")
    print(json.dumps(data, indent=2))
    print("-------------------------------------------\n")
    return {"status": "success", "message": "Snapshot received"}

@app.post("/ingest/event")
async def receive_event(request: Request):
    data = await request.json()
    print("\n🚨 --- Real-Time Event Received --- 🚨")
    print(json.dumps(data, indent=2))
    print("--------------------------------------\n")
    return {"status": "success", "message": "Event received"}

# THE MISSING ENDPOINT IS HERE
@app.post("/ingest/suspicious_event")
async def receive_suspicious_event(request: Request):
    data = await request.json()
    print("\n💥💥 HIGH-PRIORITY SUSPICIOUS BEHAVIOR DETECTED! 💥💥")
    print(json.dumps(data, indent=2))
    print("------------------------------------------------------\n")
    return {"status": "success", "message": "Suspicious event received"}

# NEW ENDPOINT FOR VULNERABILITY ALERTS
@app.post("/ingest/vulnerability_event")
async def receive_vulnerability_event(request: Request):
    data = await request.json()
    print("\n🛡️🛡️ SECURITY VULNERABILITY DETECTED! 🛡️🛡️")
    print(json.dumps(data, indent=2))
    print("--------------------------------------------------\n")
    return {"status": "success", "message": "Vulnerability event received"}