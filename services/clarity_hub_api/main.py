from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
import datetime
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware

# --- Pydantic Models ---
class ProcessInfo(BaseModel):
    pid: int
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
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON)

class EventDB(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON)

Base.metadata.create_all(bind=engine)

# --- Response Models for UI ---
class SnapshotResponse(BaseModel):
    id: str
    hostname: str
    os: str
    timestamp: str

class EventResponse(BaseModel):
    id: str
    type: str
    hostname: str
    details: str
    timestamp: str
    severity: Optional[str] = "medium"

class AlertResponse(BaseModel):
    id: str
    severity: str
    timestamp: str
    hostname: str
    details: str
    status: str = "new"
    eventType: str

class HardwareInfoResponse(BaseModel):
    cpu: str
    ram: str
    disk: str
    gpu: Optional[str] = None

class InstalledSoftwareResponse(BaseModel):
    id: str
    name: str
    version: str
    publisher: Optional[str] = None
    installDate: Optional[str] = None

class EndpointDetailResponse(BaseModel):
    hostname: str
    os: str
    lastSeen: str
    status: str = "online"
    hardware: HardwareInfoResponse
    software: List[InstalledSoftwareResponse]
    events: List[EventResponse]

class CVEDetailsResponse(BaseModel):
    id: str
    cvssScore: float
    severity: str
    attackVector: str
    summary: str
    affectedEndpoints: List[str]
    publishedDate: str
    lastModified: str
    references: List[str]

class EndpointActionResponse(BaseModel):
    status: str
    message: str
    hostname: str
    action: str
    timestamp: str

# --- FastAPI Application ---
app = FastAPI(
    title="Voltaxe Clarity Hub API",
    description="Professional cybersecurity monitoring and threat intelligence platform",
    version="2.0.0"
)

# Health check endpoint
@app.get("/health")
def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "service": "Voltaxe Clarity Hub API",
        "version": "2.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    db_snapshot = SnapshotDB(hostname=snapshot.hostname, details=snapshot.dict())
    db.add(db_snapshot); db.commit(); db.refresh(db_snapshot)
    print("✅ --- Snapshot saved to database! --- ✅")
    return {"status": "success", "snapshot_id": db_snapshot.id}

@app.post("/ingest/event")
def create_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n🚨 --- Receiving and Saving Real-Time Event --- 🚨")
    db_event = EventDB(hostname=event.hostname, event_type=event.event_type, details=event.dict())
    db.add(db_event); db.commit(); db.refresh(db_event)
    return {"status": "success", "event_id": db_event.id}

@app.post("/ingest/suspicious_event")
def create_suspicious_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n💥💥 Receiving and Saving Suspicious Behavior Event 💥💥")
    db_event = EventDB(hostname=event.hostname, event_type=event.event_type, details=event.dict())
    db.add(db_event); db.commit(); db.refresh(db_event)
    return {"status": "success", "event_id": db_event.id}

@app.post("/ingest/vulnerability_event")
def create_vulnerability_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n🛡️🛡️ Receiving and Saving Vulnerability Event 🛡️🛡️")
    db_event = EventDB(hostname=event.hostname, event_type=event.event_type, details=event.dict())
    db.add(db_event); db.commit(); db.refresh(db_event)
    return {"status": "success", "event_id": db_event.id}

# --- GET Endpoints for UI ---
@app.get("/snapshots", response_model=List[SnapshotResponse])
def get_snapshots(db: Session = Depends(get_db)):
    """Get all system snapshots for dashboard"""
    snapshots = db.query(SnapshotDB).order_by(SnapshotDB.timestamp.desc()).limit(50).all()
    return [
        SnapshotResponse(
            id=str(snap.id),
            hostname=snap.hostname,  # type: ignore
            os=snap.details.get("os", "Unknown"),  # type: ignore
            timestamp=snap.timestamp.isoformat()  # type: ignore
        )
        for snap in snapshots
    ]

@app.get("/events", response_model=List[EventResponse])
def get_events(hostname: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all events, optionally filtered by hostname for endpoint-specific views"""
    print(f"\n[API] ---> Serving events (hostname filter: {hostname or 'none'}) [API]")
    
    query = db.query(EventDB)
    if hostname:
        print(f"[API] ---> Filtering events for hostname: {hostname} [API]")
        query = query.filter(EventDB.hostname == hostname)
    
    events = query.order_by(EventDB.timestamp.desc()).limit(100).all()
    print(f"[API] ---> Returning {len(events)} events [API]")
    
    return [
        EventResponse(
            id=str(event.id),
            type=event.event_type,  # type: ignore
            hostname=event.hostname,  # type: ignore
            details=_format_event_details(event.details, event.event_type),  # type: ignore
            timestamp=event.timestamp.isoformat(),  # type: ignore
            severity=_get_event_severity(event.event_type)  # type: ignore
        )
        for event in events
    ]

@app.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    severity: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    """
    Retrieves alerts with advanced filtering.
    Enhanced with dynamic query building for better performance.
    """
    print(f"\n[API] ---> Serving filtered alerts (search={search}, severity={severity}, dates={startDate}-{endDate})... [API]")
    
    # Start with a query for high-priority events
    query = db.query(EventDB).filter(EventDB.event_type.in_([
        'VULNERABILITY_DETECTED', 
        'SUSPICIOUS_PARENT_CHILD_PROCESS',
        'SUSPICIOUS_PARENT_CHILD'
    ]))

    # Dynamically add filters based on query parameters
    if search:
        # Enhanced search against hostname, event type, and details JSON
        search_term = f"%{search}%"
        query = query.filter(or_(
            EventDB.hostname.ilike(search_term),
            EventDB.event_type.ilike(search_term),
            EventDB.details.op('->>')('cve').ilike(search_term),
            EventDB.details.op('->>')('reason').ilike(search_term)
        ))
    
    if startDate:
        try:
            start_dt = datetime.datetime.fromisoformat(startDate.replace('Z', '+00:00'))
            query = query.filter(EventDB.timestamp >= start_dt)
        except ValueError:
            pass  # Invalid date format, ignore filter
    
    if endDate:
        try:
            # Add 1 day to endDate to include the full day
            end_dt = datetime.datetime.fromisoformat(endDate.replace('Z', '+00:00')) + datetime.timedelta(days=1)
            query = query.filter(EventDB.timestamp < end_dt)
        except ValueError:
            pass  # Invalid date format, ignore filter

    # Execute query and get results
    db_events = query.order_by(EventDB.timestamp.desc()).limit(100).all()
    
    # Convert to alerts with severity filtering
    alerts = []
    for event in db_events:
        event_severity = _get_event_severity(event.event_type)  # type: ignore
        
        # Apply severity filter if specified
        if severity and severity != "all" and event_severity != severity:
            continue
            
        alerts.append(AlertResponse(
            id=str(event.id),
            severity=event_severity,
            timestamp=event.timestamp.isoformat(),  # type: ignore
            hostname=event.hostname,  # type: ignore
            details=_format_event_details(event.details, event.event_type),  # type: ignore
            status="new",
            eventType=event.event_type  # type: ignore
        ))
    
    print(f"[API] ---> Returning {len(alerts)} filtered alerts [API]")
    return alerts

@app.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    """Acknowledge an alert (mark as acknowledged)"""
    # For now, just return success. In a real implementation,
    # you'd update an alert status in the database
    return {"status": "success", "message": f"Alert {alert_id} acknowledged"}

@app.get("/vulnerabilities/{cve_id}", response_model=CVEDetailsResponse)
def get_vulnerability_details(cve_id: str, db: Session = Depends(get_db)):
    """
    Get detailed vulnerability information for CVE intelligence.
    In production, this would query NIST NVD API or local CVE database.
    """
    print(f"\n[API] ---> Fetching vulnerability details for {cve_id} [API]")
    
    # Mock CVE database - in production, integrate with NIST NVD
    cve_database = {
        "CVE-2024-12345": {
            "id": "CVE-2024-12345",
            "cvssScore": 9.8,
            "severity": "Critical",
            "attackVector": "Remote Code Execution via Network",
            "summary": "Docker Desktop for Windows allows attackers to overwrite any file through the hyperv/create Docker API by controlling the DataFolder parameter in the POST request, enabling local privilege escalation.",
            "publishedDate": "2024-09-15",
            "lastModified": "2024-09-20",
            "references": [
                "https://nvd.nist.gov/vuln/detail/CVE-2024-12345",
                "https://www.docker.com/security-advisory"
            ]
        },
        "CVE-2023-45678": {
            "id": "CVE-2023-45678",
            "cvssScore": 7.5,
            "severity": "High",
            "attackVector": "Information Disclosure via Local Access",
            "summary": "A vulnerability in the system configuration allows local users to access sensitive information through improper file permissions.",
            "publishedDate": "2023-11-10",
            "lastModified": "2023-11-15",
            "references": [
                "https://nvd.nist.gov/vuln/detail/CVE-2023-45678"
            ]
        }
    }
    
    if cve_id not in cve_database:
        raise HTTPException(status_code=404, detail=f"CVE {cve_id} not found in database")
    
    cve_data = cve_database[cve_id]
    
    # Find affected endpoints by querying events
    affected_events = db.query(EventDB).filter(
        EventDB.event_type == 'VULNERABILITY_DETECTED',
        EventDB.details.op('->>')('cve') == cve_id
    ).all()
    
    affected_endpoints = list(set([str(event.hostname) for event in affected_events]))
    
    return CVEDetailsResponse(
        **cve_data,
        affectedEndpoints=affected_endpoints
    )

@app.post("/endpoints/{hostname}/isolate", response_model=EndpointActionResponse)
def isolate_endpoint(hostname: str, db: Session = Depends(get_db)):
    """
    Isolate an endpoint from the network.
    This endpoint serves as integration point for Voltaxe Strike Module.
    """
    print(f"\n🚨🚨 ACTION: Isolation requested for '{hostname}' 🚨🚨")
    
    # Verify endpoint exists
    endpoint_exists = db.query(SnapshotDB).filter(
        SnapshotDB.hostname == hostname
    ).first()
    
    if not endpoint_exists:
        raise HTTPException(status_code=404, detail=f"Endpoint '{hostname}' not found")
    
    # In production, this would:
    # 1. Send isolation command to Voltaxe Strike Module
    # 2. Update endpoint status in database
    # 3. Log the action for audit trail
    # 4. Send notifications to security team
    
    timestamp = datetime.datetime.utcnow().isoformat()
    
    print(f"[SECURITY ACTION] {timestamp}: Endpoint '{hostname}' has been isolated from network")
    print(f"[AUDIT LOG] Isolation action logged for compliance and forensics")
    
    return EndpointActionResponse(
        status="success",
        message=f"Endpoint '{hostname}' has been successfully isolated from the network",
        hostname=hostname,
        action="isolate",
        timestamp=timestamp
    )

@app.post("/endpoints/{hostname}/scan", response_model=EndpointActionResponse)
def scan_endpoint(hostname: str, db: Session = Depends(get_db)):
    """
    Initiate a security scan on an endpoint.
    This endpoint serves as integration point for Voltaxe Sentinel agent.
    """
    print(f"\n🔍🔍 ACTION: Security scan requested for '{hostname}' 🔍🔍")
    
    # Verify endpoint exists
    endpoint_exists = db.query(SnapshotDB).filter(
        SnapshotDB.hostname == hostname
    ).first()
    
    if not endpoint_exists:
        raise HTTPException(status_code=404, detail=f"Endpoint '{hostname}' not found")
    
    # In production, this would:
    # 1. Send scan command to Voltaxe Sentinel agent
    # 2. Queue the scan job
    # 3. Return scan job ID for tracking
    
    timestamp = datetime.datetime.utcnow().isoformat()
    
    print(f"[SECURITY SCAN] {timestamp}: Security scan initiated for '{hostname}'")
    print(f"[AGENT COMMAND] Scan request sent to Voltaxe Sentinel on '{hostname}'")
    
    return EndpointActionResponse(
        status="success",
        message=f"Security scan has been initiated on endpoint '{hostname}'",
        hostname=hostname,
        action="scan",
        timestamp=timestamp
    )

@app.get("/endpoints/{hostname}", response_model=EndpointDetailResponse)
def get_endpoint_detail(hostname: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific endpoint with enhanced data"""
    print(f"\n[API] ---> Fetching endpoint details for '{hostname}' [API]")
    
    # Get latest snapshot for this hostname
    latest_snapshot = db.query(SnapshotDB).filter(
        SnapshotDB.hostname == hostname
    ).order_by(SnapshotDB.timestamp.desc()).first()
    
    if not latest_snapshot:
        print(f"[API] ---> ERROR: Endpoint '{hostname}' not found [API]")
        raise HTTPException(status_code=404, detail=f"Endpoint '{hostname}' not found")
    
    # Get recent events for this hostname
    events = db.query(EventDB).filter(
        EventDB.hostname == hostname
    ).order_by(EventDB.timestamp.desc()).limit(20).all()
    
    # Extract hardware info from snapshot
    hardware_info = latest_snapshot.details.get("hardware_info", {})
    installed_software = latest_snapshot.details.get("installed_software", [])
    
    return EndpointDetailResponse(
        hostname=hostname,
        os=latest_snapshot.details.get("os", "Unknown"),
        lastSeen=latest_snapshot.timestamp.isoformat(),
        status="online",
        hardware=HardwareInfoResponse(
            cpu=hardware_info.get("cpu_model", "Unknown"),
            ram=f"{hardware_info.get('total_ram_gb', 0)} GB",
            disk="Unknown",  # Not captured yet
            gpu=None
        ),
        software=[
            InstalledSoftwareResponse(
                id=str(i),
                name=sw.get("name", "Unknown"),
                version=sw.get("version", "Unknown"),
                publisher=None,
                installDate=None
            )
            for i, sw in enumerate(installed_software)
        ],
        events=[
            EventResponse(
                id=str(event.id),
                type=event.event_type,  # type: ignore
                hostname=event.hostname,  # type: ignore
                details=_format_event_details(event.details, event.event_type),  # type: ignore
                timestamp=event.timestamp.isoformat(),  # type: ignore
                severity=_get_event_severity(event.event_type)  # type: ignore
            )
            for event in events
        ]
    )

# --- Helper Functions ---
def _get_event_severity(event_type: str) -> str:
    """Determine severity based on event type"""
    severity_map = {
        "VULNERABILITY_DETECTED": "critical",
        "SUSPICIOUS_PARENT_CHILD_PROCESS": "high", 
        "NEW_PROCESS_DETECTED": "medium",
        "SUSPICIOUS_PARENT_CHILD": "high"
    }
    return severity_map.get(event_type, "medium")

def _format_event_details(details: Dict[str, Any], event_type: str) -> str:
    """Enhanced event details formatting with better CVE and process information"""
    if event_type == "VULNERABILITY_DETECTED":
        vuln_sw = details.get("vulnerable_software", {})
        cve = details.get("cve", "Unknown")
        sw_name = vuln_sw.get('name', 'Unknown Software')
        return f"Vulnerability found in {sw_name} - {cve}"
    
    elif event_type in ["SUSPICIOUS_PARENT_CHILD_PROCESS", "SUSPICIOUS_PARENT_CHILD"]:
        child = details.get("child_process", {})
        parent = details.get("parent_process", {})
        child_name = child.get('name', 'Unknown Process')
        parent_name = parent.get('name', 'Unknown Process')
        return f"Suspicious: {parent_name} spawned {child_name}"
    
    elif event_type == "NEW_PROCESS_DETECTED":
        process = details.get("process", {})
        return f"New process detected: {process.get('name', 'Unknown')}"
    
    else:
        # Fallback for any other event types
        reason = details.get("reason", "")
        if reason:
            return f"{event_type}: {reason}"
        return f"Event: {event_type.replace('_', ' ').title()}"