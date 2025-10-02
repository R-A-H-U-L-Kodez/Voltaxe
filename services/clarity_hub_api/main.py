# In: services/clarity_hub_api/main.py
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
import datetime
from typing import List, Optional

# --- Pydantic Models ---
class ProcessInfo(BaseModel):
    pid: int  # <<< THIS LINE IS NOW CORRECTED
    name: str

class SoftwareInfo(BaseModel):
    name: str
    version: str

class HardwareInfo(BaseModel):
    platform: str
    cpu_model: str
    total_ram_gb: int
    total_cores: int

class SystemInfoSnapshot(BaseModel):
    hostname: str
    os: str
    architecture: str
    hardware_info: HardwareInfo
    processes: List[ProcessInfo]
    installed_software: List[SoftwareInfo]

class EventModel(BaseModel):
    hostname: str
    event_type: str
    process: Optional[ProcessInfo] = None
    parent_process: Optional[ProcessInfo] = None
    vulnerable_software: Optional[SoftwareInfo] = None
    reason: Optional[str] = None
    cve: Optional[str] = None

# --- Database Setup ---
DATABASE_URL = "postgresql://postgres:mysecretpassword@localhost/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SnapshotDB(Base):
    __tablename__ = "snapshots"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    os = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    hardware_info = Column(JSON)
    processes = Column(JSON)
    installed_software = Column(JSON)

class EventDB(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    event_type = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON)

Base.metadata.create_all(bind=engine)

# --- FastAPI Application ---
app = FastAPI()

# THIS IS THE CORRECTED FUNCTION
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---
@app.post("/ingest/snapshot")
def create_snapshot(snapshot: SystemInfoSnapshot, db: Session = Depends(get_db)):
    print("\n📸 --- Receiving and Saving Snapshot --- 📸")
    db_snapshot = SnapshotDB(hostname=snapshot.hostname, os=snapshot.os, hardware_info=snapshot.hardware_info.dict(), processes=[p.dict() for p in snapshot.processes], installed_software=[s.dict() for s in snapshot.installed_software])
    db.add(db_snapshot); db.commit(); db.refresh(db_snapshot)
    print("✅ --- Snapshot saved to database! --- ✅")
    return {"status": "success", "snapshot_id": db_snapshot.id}

@app.post("/ingest/vulnerability_event")
def create_vulnerability_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n🛡️🛡️ Saving Vulnerability Event 🛡️🛡️")
    db_event = EventDB(hostname=event.hostname, event_type=event.event_type, details=event.dict())
    db.add(db_event); db.commit(); db.refresh(db_event)
    return {"status": "success", "event_id": db_event.id}

@app.post("/ingest/suspicious_event")
def create_suspicious_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n💥💥 Saving Suspicious Behavior Event 💥💥")
    db_event = EventDB(hostname=event.hostname, event_type=event.event_type, details=event.dict())
    db.add(db_event); db.commit(); db.refresh(db_event)
    return {"status": "success", "event_id": db_event.id}