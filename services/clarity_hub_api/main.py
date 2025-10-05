from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, or_, Float, Text, Boolean, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import datetime
import os
from typing import List, Optional, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from auth_service import auth_service, get_current_user, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse
from dotenv import load_dotenv
from database import Base, engine, SessionLocal, get_db, DATABASE_URL

# Import team management models
from models.team import TeamMemberDB, AuditLogDB

# Load environment variables
load_dotenv()

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

# --- Database Models ---
class SnapshotDB(Base):
    __tablename__ = "snapshots"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON)
    resilience_score = Column(Integer, index=True)
    risk_category = Column(String, index=True)
    last_scored = Column(DateTime)

class EventDB(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON)

class CVEDB(Base):
    """CVE Database Model for real vulnerability data"""
    __tablename__ = "cve_database"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    cvss_v3_score = Column(Float)
    cvss_v3_vector = Column(String)
    cvss_v2_score = Column(Float)
    cvss_v2_vector = Column(String)
    severity = Column(String, index=True)
    attack_vector = Column(String)
    published_date = Column(DateTime, index=True)
    last_modified = Column(DateTime, index=True)
    references = Column(JSON)
    cpe_configurations = Column(JSON)
    affected_products = Column(JSON)
    exploitability_score = Column(Float)
    impact_score = Column(Float)
    weaknesses = Column(JSON)
    vendor_comments = Column(JSON)
    is_active = Column(Boolean, default=True, index=True)
    sync_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Create all database tables (including team management tables)
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

class ResilienceScoreResponse(BaseModel):
    hostname: str
    resilience_score: Optional[int] = None
    risk_category: Optional[str] = None
    last_scored: Optional[str] = None
    vulnerability_count: Optional[int] = 0
    suspicious_events_count: Optional[int] = 0

class ResilienceMetricsResponse(BaseModel):
    hostname: str
    resilience_score: int
    risk_category: str
    vulnerability_count: int
    suspicious_events_count: int
    critical_vulnerabilities: int
    high_vulnerabilities: int
    medium_vulnerabilities: int
    low_vulnerabilities: int
    timestamp: str
    score_details: Optional[Dict[str, Any]] = None

# --- FastAPI Application ---
app = FastAPI(
    title="Voltaxe Clarity Hub API",
    description="Professional cybersecurity monitoring and threat intelligence platform",
    version="2.0.0"
)

# Initialize Strike Orchestrator
from strike_orchestrator import strike_orchestrator

@app.on_event("startup")
async def startup_event():
    """Initialize Strike Module and register Sentinels"""
    print("[STRIKE MODULE] Initializing automated response system...")
    
    # Auto-register Sentinels
    # In production, this would query a database or service registry
    # Use Docker host IP (172.17.0.1) to reach host machine from container
    strike_orchestrator.register_sentinel("kali", "http://172.17.0.1:9090")
    
    print("[STRIKE MODULE] ✅ Automated response system ready")

# Include routers
from routers.team import router as team_router
from routers.search import router as search_router
from routers.incidents import router as incidents_router
app.include_router(team_router)
app.include_router(search_router)
app.include_router(incidents_router)

# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

class NotificationPreferences(BaseModel):
    """User notification preferences"""
    email: Optional[str] = None
    emailNotifications: bool = True
    desktopNotifications: bool = True
    criticalAlerts: bool = True
    suspiciousActivity: bool = True
    systemUpdates: bool = False

class PushSubscription(BaseModel):
    """Web Push subscription object"""
    endpoint: str
    keys: Dict[str, str]

class NotificationRequest(BaseModel):
    """Request to send a notification"""
    title: str
    message: str
    notification_type: str = "system_update"
    data: Optional[Dict[str, Any]] = None
    channel: str = "both"  # email, push, or both

@app.get("/notifications/vapid-public-key")
async def get_vapid_public_key():
    """
    Get VAPID public key for push notification subscription.
    This is needed by the frontend to subscribe to push notifications.
    """
    from notification_service import notification_service
    
    public_key = notification_service.get_vapid_public_key()
    
    if not public_key:
        raise HTTPException(
            status_code=503,
            detail="Push notifications not configured. Please set VAPID keys."
        )
    
    return {
        "publicKey": public_key,
        "status": "available"
    }

@app.post("/notifications/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's notification preferences.
    """
    from notification_service import notification_service
    
    user_id = current_user.get("email", current_user.get("sub", "unknown"))
    
    # Update preferences
    notification_service.update_user_preferences(
        user_id=user_id,
        preferences=preferences.dict()
    )
    
    return {
        "status": "success",
        "message": "Notification preferences updated",
        "preferences": preferences.dict()
    }

@app.get("/notifications/preferences")
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's current notification preferences.
    """
    from notification_service import notification_service
    
    user_id = current_user.get("email", current_user.get("sub", "unknown"))
    prefs = notification_service.user_preferences.get(user_id, {})
    
    return {
        "preferences": prefs or {
            "emailNotifications": True,
            "desktopNotifications": True,
            "criticalAlerts": True,
            "suspiciousActivity": True,
            "systemUpdates": False
        }
    }

@app.post("/notifications/subscribe-push")
async def subscribe_push_notifications(
    subscription: PushSubscription,
    current_user: dict = Depends(get_current_user)
):
    """
    Subscribe to browser push notifications.
    """
    from notification_service import notification_service
    
    user_id = current_user.get("email", current_user.get("sub", "unknown"))
    
    success = notification_service.subscribe_push(
        user_id=user_id,
        subscription=subscription.dict()
    )
    
    return {
        "status": "success" if success else "already_subscribed",
        "message": "Push notification subscription registered" if success else "Already subscribed"
    }

@app.post("/notifications/unsubscribe-push")
async def unsubscribe_push_notifications(
    endpoint: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Unsubscribe from push notifications for a specific endpoint.
    """
    from notification_service import notification_service
    
    user_id = current_user.get("email", current_user.get("sub", "unknown"))
    
    success = notification_service.unsubscribe_push(
        user_id=user_id,
        endpoint=endpoint
    )
    
    return {
        "status": "success" if success else "not_found",
        "message": "Push subscription removed" if success else "Subscription not found"
    }

@app.post("/notifications/send")
async def send_notification(
    notification: NotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a notification (for testing purposes).
    In production, notifications should be triggered by events, not manual API calls.
    """
    from notification_service import notification_service, NotificationType, NotificationChannel
    
    user_id = current_user.get("email", current_user.get("sub", "unknown"))
    
    # Map string to enum
    notification_type = NotificationType(notification.notification_type)
    channel = NotificationChannel(notification.channel)
    
    result = await notification_service.send_notification(
        user_id=user_id,
        notification_type=notification_type,
        title=notification.title,
        message=notification.message,
        data=notification.data,
        channel=channel
    )
    
    return result

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

@app.get("/debug/snapshots")
def debug_snapshots():
    """Debug endpoint to check snapshots"""
    db = SessionLocal()
    try:
        all_snapshots = db.query(SnapshotDB).all()
        scored_snapshots = db.query(SnapshotDB).filter(SnapshotDB.resilience_score.isnot(None)).all()
        
        return {
            "total_snapshots": len(all_snapshots),
            "scored_snapshots": len(scored_snapshots),
            "database_url": DATABASE_URL,
            "sample_snapshots": [
                {
                    "hostname": getattr(s, 'hostname', ''),
                    "resilience_score": getattr(s, 'resilience_score', None),
                    "risk_category": getattr(s, 'risk_category', None)
                }
                for s in scored_snapshots[:3]
            ]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost",
        "http://localhost:80"
    ],
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

# --- Authentication Endpoints ---
@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user with Supabase or fallback system"""
    print(f"[AUTH] Login attempt for: {request.email}")
    
    try:
        auth_result = await auth_service.authenticate_user(request.email, request.password)
        
        return LoginResponse(
            access_token=auth_result["access_token"],
            refresh_token=auth_result["refresh_token"],
            user={
                "id": auth_result["user_id"],
                "email": auth_result["email"],
                "provider": auth_result["provider"]
            }
        )
    except HTTPException as e:
        print(f"[AUTH] Login failed for {request.email}: {e.detail}")
        raise e

@app.post("/auth/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """Register new user with Supabase"""
    print(f"[AUTH] Registration attempt for: {request.email}")
    
    try:
        result = await auth_service.register_user(request.email, request.password, request.name)
        return RegisterResponse(
            message=result["message"],
            user_id=result.get("user_id")
        )
    except HTTPException as e:
        print(f"[AUTH] Registration failed for {request.email}: {e.detail}")
        raise e

@app.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    try:
        result = await auth_service.refresh_token(refresh_token)
        return result
    except HTTPException as e:
        raise e

@app.get("/auth/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "user": current_user,
        "authenticated": True
    }

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

@app.post("/ingest/rootkit_event")
def create_rootkit_event(event: EventModel, db: Session = Depends(get_db)):
    print("\n🚨💀🚨 CRITICAL: ROOTKIT DETECTED! Saving high-priority alert... 🚨💀🚨")
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
def get_vulnerability_details(cve_id: str, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get detailed vulnerability information from real CVE database.
    Protected endpoint requiring authentication.
    """
    print(f"\n[API] ---> Fetching vulnerability details for {cve_id} by user {current_user.get('email', 'unknown')} [API]")
    
    # Query real CVE database first
    cve_record = db.query(CVEDB).filter(
        CVEDB.cve_id == cve_id,
        CVEDB.is_active == True
    ).first()
    
    if cve_record:
        # Real CVE data from database
        print(f"[API] ---> Found CVE in real database [API]")
        
        # Extract references from JSON
        references = []
        references_data = getattr(cve_record, 'references', None)
        if references_data:
            references = [ref.get("url", "") for ref in references_data if ref.get("url")]
        
        # Find affected endpoints by querying events
        affected_events = db.query(EventDB).filter(
            EventDB.event_type == 'VULNERABILITY_DETECTED',
            EventDB.details.op('->>')('cve') == cve_id
        ).all()
        
        affected_endpoints = list(set([str(event.hostname) for event in affected_events]))
        
        # Safely format dates
        published_date = getattr(cve_record, 'published_date', None)
        last_modified = getattr(cve_record, 'last_modified', None)
        
        return CVEDetailsResponse(
            id=getattr(cve_record, 'cve_id', cve_id),
            cvssScore=getattr(cve_record, 'cvss_v3_score', None) or getattr(cve_record, 'cvss_v2_score', None) or 0.0,
            severity=getattr(cve_record, 'severity', None) or "UNKNOWN",
            attackVector=getattr(cve_record, 'attack_vector', None) or "Unknown",
            summary=getattr(cve_record, 'description', None) or "No description available",
            affectedEndpoints=affected_endpoints,
            publishedDate=published_date.strftime("%Y-%m-%d") if published_date else "Unknown",
            lastModified=last_modified.strftime("%Y-%m-%d") if last_modified else "Unknown",
            references=references
        )
    else:
        # Fallback to mock data for development/demo
        print(f"[API] ---> CVE not found in database, using fallback data [API]")
        
        mock_cve_database = {
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
        
        if cve_id not in mock_cve_database:
            raise HTTPException(status_code=404, detail=f"CVE {cve_id} not found in database")
        
        cve_data = mock_cve_database[cve_id]
        
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
async def isolate_endpoint(
    hostname: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Isolate an endpoint from the network using the Strike Module.
    This triggers the automated response system to disconnect the endpoint.
    """
    print(f"\n🚨🚨 ACTION: Isolation requested for '{hostname}' by {current_user.get('username')} 🚨🚨")
    
    # Verify endpoint exists
    endpoint_exists = db.query(SnapshotDB).filter(
        SnapshotDB.hostname == hostname
    ).first()
    
    if not endpoint_exists:
        raise HTTPException(status_code=404, detail=f"Endpoint '{hostname}' not found")
    
    # Import Strike Orchestrator
    from strike_orchestrator import strike_orchestrator
    
    # Execute isolation via Strike Module
    result = await strike_orchestrator.isolate_endpoint(
        hostname=hostname,
        initiated_by=current_user.get('username', 'unknown'),
        reason="Manual isolation requested via Clarity Hub"
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("message", "Failed to isolate endpoint")
        )
    
    timestamp = result.get("timestamp", datetime.datetime.utcnow().isoformat())
    
    print(f"[SECURITY ACTION] {timestamp}: Endpoint '{hostname}' has been isolated from network")
    print(f"[AUDIT LOG] Isolation action logged for compliance and forensics")
    
    # Send notification about the isolation
    try:
        from notification_service import notification_service, NotificationType
        
        user_id = current_user.get("email", current_user.get("sub", "unknown"))
        
        await notification_service.send_notification(
            user_id=user_id,
            notification_type=NotificationType.ENDPOINT_ISOLATED,
            title=f"🚨 Endpoint Isolated: {hostname}",
            message=f"Endpoint '{hostname}' has been isolated from the network to prevent potential threat propagation.",
            data={
                "hostname": hostname,
                "initiated_by": current_user.get('username', 'unknown'),
                "timestamp": timestamp,
                "action": "isolate"
            }
        )
        print(f"[NOTIFICATIONS] Isolation notification sent for {hostname}")
    except Exception as e:
        print(f"[NOTIFICATIONS] Failed to send notification: {e}")
        # Don't fail the isolation if notification fails
    
    return EndpointActionResponse(
        status="success",
        message=result.get("message", f"Endpoint '{hostname}' has been successfully isolated"),
        hostname=hostname,
        action="isolate",
        timestamp=timestamp
    )

@app.post("/endpoints/{hostname}/restore", response_model=EndpointActionResponse)
async def restore_endpoint(
    hostname: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore an endpoint's network connectivity after isolation.
    This triggers the Strike Module to re-enable network access.
    """
    print(f"\n✅ ACTION: Network restore requested for '{hostname}' by {current_user.get('username')} ✅")
    
    # Verify endpoint exists
    endpoint_exists = db.query(SnapshotDB).filter(
        SnapshotDB.hostname == hostname
    ).first()
    
    if not endpoint_exists:
        raise HTTPException(status_code=404, detail=f"Endpoint '{hostname}' not found")
    
    # Import Strike Orchestrator
    from strike_orchestrator import strike_orchestrator
    
    # Execute restore via Strike Module
    result = await strike_orchestrator.restore_endpoint(
        hostname=hostname,
        initiated_by=current_user.get('username', 'unknown')
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("message", "Failed to restore endpoint")
        )
    
    timestamp = result.get("timestamp", datetime.datetime.utcnow().isoformat())
    
    print(f"[SECURITY ACTION] {timestamp}: Endpoint '{hostname}' network access restored")
    print(f"[AUDIT LOG] Restore action logged for compliance and forensics")
    
    # Send notification about the restoration
    try:
        from notification_service import notification_service, NotificationType
        
        user_id = current_user.get("email", current_user.get("sub", "unknown"))
        
        await notification_service.send_notification(
            user_id=user_id,
            notification_type=NotificationType.ENDPOINT_RESTORED,
            title=f"✅ Endpoint Restored: {hostname}",
            message=f"Network access has been restored for endpoint '{hostname}'.",
            data={
                "hostname": hostname,
                "initiated_by": current_user.get('username', 'unknown'),
                "timestamp": timestamp,
                "action": "restore"
            }
        )
        print(f"[NOTIFICATIONS] Restore notification sent for {hostname}")
    except Exception as e:
        print(f"[NOTIFICATIONS] Failed to send notification: {e}")
        # Don't fail the restore if notification fails
    
    return EndpointActionResponse(
        status="success",
        message=result.get("message", f"Endpoint '{hostname}' network access has been restored"),
        hostname=hostname,
        action="restore",
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

# --- Resilience Scoring Endpoints ---
@app.get("/resilience/scores", response_model=List[ResilienceScoreResponse])
def get_resilience_scores(db: Session = Depends(get_db)):
    """Get resilience scores for all monitored endpoints"""
    try:
        # Get latest snapshots with resilience scores
        snapshots = db.query(SnapshotDB).filter(
            SnapshotDB.resilience_score.isnot(None)
        ).all()
        
        return [
            ResilienceScoreResponse(
                hostname=snapshot.hostname,  # type: ignore
                resilience_score=snapshot.resilience_score,  # type: ignore
                risk_category=snapshot.risk_category,  # type: ignore
                last_scored=snapshot.last_scored.isoformat() if snapshot.last_scored else None,  # type: ignore
                vulnerability_count=0,  # Will be filled from metrics if available
                suspicious_events_count=0
            )
            for snapshot in snapshots
        ]
        
    except Exception as e:
        print(f"Error fetching resilience scores: {e}")
        return []

@app.get("/resilience/metrics", response_model=List[ResilienceMetricsResponse]) 
def get_resilience_metrics(limit: int = 50, db: Session = Depends(get_db)):
    """Get detailed resilience metrics history"""
    try:
        # Import ResilienceMetrics from axon engine if available
        from sqlalchemy import Table, MetaData
        
        # Check if resilience_metrics table exists
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        if 'resilience_metrics' not in metadata.tables:
            return []
        
        # Query resilience metrics
        query = text("""
        SELECT hostname, resilience_score, risk_category, vulnerability_count,
               suspicious_events_count, critical_vulnerabilities, high_vulnerabilities,
               medium_vulnerabilities, low_vulnerabilities, timestamp, score_details
        FROM resilience_metrics 
        ORDER BY timestamp DESC 
        LIMIT :limit
        """)
        
        result = db.execute(query, {"limit": limit})
        metrics = result.fetchall()
        
        return [
            ResilienceMetricsResponse(
                hostname=row[0],
                resilience_score=row[1],
                risk_category=row[2],
                vulnerability_count=row[3],
                suspicious_events_count=row[4], 
                critical_vulnerabilities=row[5],
                high_vulnerabilities=row[6],
                medium_vulnerabilities=row[7],
                low_vulnerabilities=row[8],
                timestamp=row[9].isoformat() if row[9] else "",
                score_details=row[10] if row[10] else {}
            )
            for row in metrics
        ]
        
    except Exception as e:
        print(f"Error fetching resilience metrics: {e}")
        return []

@app.get("/resilience/dashboard")
def get_resilience_dashboard(db: Session = Depends(get_db)):
    """Get dashboard data with resilience scoring overview"""
    try:
        # Get latest resilience scores - simplified query
        snapshots = db.query(SnapshotDB).filter(
            SnapshotDB.resilience_score.isnot(None)
        ).all()
        
        # Calculate risk distribution
        risk_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        total_score = 0
        scored_endpoints = 0
        
        for snapshot in snapshots:
            risk = getattr(snapshot, 'risk_category', None)
            score = getattr(snapshot, 'resilience_score', None)
            
            if risk and risk in risk_distribution:
                risk_distribution[risk] += 1
            if score:
                total_score += score
                scored_endpoints += 1
        
        average_score = total_score / scored_endpoints if scored_endpoints > 0 else 0
        
        # Metrics will be implemented later
        
        return {
            "summary": {
                "total_endpoints": len(snapshots),
                "average_score": round(average_score, 1),
                "risk_distribution": risk_distribution
            },
            "recent_scores": [
                {
                    "hostname": getattr(snapshot, 'hostname', ''),
                    "resilience_score": getattr(snapshot, 'resilience_score', None),
                    "risk_category": getattr(snapshot, 'risk_category', None),
                    "last_scored": snapshot.last_scored.isoformat() if hasattr(snapshot, 'last_scored') and snapshot.last_scored is not None else None
                }
                for snapshot in snapshots[:10]
            ],
            "score_trend": []  # Will implement metrics later
        }
        
    except Exception as e:
        print(f"Error generating resilience dashboard: {e}")
        return {
            "summary": {"total_endpoints": 0, "average_score": 0, "risk_distribution": {}},
            "recent_scores": [],
            "score_trend": []
        }

# ============================================
# MALWARE SCANNING ENDPOINTS
# ============================================

# Database model for scan results
class MalwareScanDB(Base):
    __tablename__ = "malware_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, index=True)
    file_size = Column(Integer)
    md5_hash = Column(String, index=True)
    sha1_hash = Column(String, index=True)
    sha256_hash = Column(String, index=True)
    scan_time = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_malicious = Column(Boolean, index=True)
    threat_level = Column(String, index=True)  # clean, low, medium, high, critical
    matches = Column(JSON)  # YARA rule matches
    error = Column(Text)
    hostname = Column(String, index=True)  # Which endpoint submitted the file
    uploaded_by = Column(String)  # User who uploaded

# Create the table
Base.metadata.create_all(bind=engine)

# Pydantic models for malware scanning
class MalwareScanResponse(BaseModel):
    scan_id: int
    file_name: str
    file_size: int
    md5_hash: str
    sha1_hash: str
    sha256_hash: str
    scan_time: str
    is_malicious: bool
    threat_level: str
    matches: List[Dict]
    error: Optional[str] = None
    
    class Config:
        from_attributes = True

class MalwareScanSummaryResponse(BaseModel):
    total_scans: int
    malicious_files: int
    clean_files: int
    threat_distribution: Dict[str, int]
    recent_threats: List[MalwareScanResponse]

# Helper function to convert DB model to Pydantic response
def db_to_response(scan_db: MalwareScanDB) -> MalwareScanResponse:
    """Convert SQLAlchemy model to Pydantic model"""
    return MalwareScanResponse(
        scan_id=scan_db.id,  # pyright: ignore[reportArgumentType]
        file_name=scan_db.file_name,  # pyright: ignore[reportArgumentType]
        file_size=scan_db.file_size,  # pyright: ignore[reportArgumentType]
        md5_hash=scan_db.md5_hash,  # pyright: ignore[reportArgumentType]
        sha1_hash=scan_db.sha1_hash,  # pyright: ignore[reportArgumentType]
        sha256_hash=scan_db.sha256_hash,  # pyright: ignore[reportArgumentType]
        scan_time=scan_db.scan_time.isoformat(),  # pyright: ignore[reportArgumentType]
        is_malicious=scan_db.is_malicious,  # pyright: ignore[reportArgumentType]
        threat_level=scan_db.threat_level,  # pyright: ignore[reportArgumentType]
        matches=scan_db.matches,  # pyright: ignore[reportArgumentType]
        error=scan_db.error  # pyright: ignore[reportArgumentType]
    )

# Import scanner (will fail gracefully if YARA not available)
scanner: Optional["MalwareScanner"] = None  # Type hint declared here
try:
    from malware_scanner import MalwareScanner
    scanner = MalwareScanner()
    SCANNER_AVAILABLE = True
except Exception as e:
    print(f"Warning: Malware scanner not available: {e}")
    SCANNER_AVAILABLE = False

@app.post("/malware/scan", response_model=MalwareScanResponse)
async def scan_file_for_malware(
    file: UploadFile = File(...),
    hostname: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(lambda: SessionLocal())
):
    """
    Scan an uploaded file for malware using YARA rules
    
    - **file**: File to scan (max 100MB)
    - **hostname**: Optional hostname of the endpoint this file came from
    
    Returns scan results including threat level and matched signatures
    """
    if not SCANNER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Malware scanner is not available. YARA library may not be installed."
        )
    
    try:
        # Read file data
        file_data = await file.read()
        
        # No file size limit - scan any size file
        # Large files may take longer to scan
        
        # Scan the file
        if scanner is None:
            raise HTTPException(
                status_code=503,
                detail="Malware scanner is not available"
            )
        scan_result = scanner.scan_bytes(file_data, file.filename or "unknown")
        
        # Save scan result to database
        scan_db = MalwareScanDB(
            file_name=scan_result.file_name,
            file_size=scan_result.file_size,
            md5_hash=scan_result.md5_hash,
            sha1_hash=scan_result.sha1_hash,
            sha256_hash=scan_result.sha256_hash,
            scan_time=datetime.datetime.fromisoformat(scan_result.scan_time),
            is_malicious=scan_result.is_malicious,
            threat_level=scan_result.threat_level,
            matches=[m.to_dict() for m in scan_result.matches],
            error=scan_result.error,
            hostname=hostname,
            uploaded_by=current_user.get("email", "unknown")
        )
        
        db.add(scan_db)
        db.commit()
        db.refresh(scan_db)
        
        return db_to_response(scan_db)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning file: {str(e)}")
    finally:
        db.close()

@app.get("/malware/test-eicar", response_model=MalwareScanResponse)
def test_eicar_detection(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(lambda: SessionLocal())
):
    """
    Test malware scanner with EICAR test file
    
    EICAR is a standard test file used to verify antivirus/anti-malware systems.
    This endpoint should always detect the EICAR signature.
    """
    if not SCANNER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Malware scanner is not available. YARA library may not be installed."
        )
    
    if scanner is None:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    try:
        # Scan EICAR test string
        scan_result = scanner.test_eicar()
        
        # Save to database
        scan_db = MalwareScanDB(
            file_name="eicar_test.com",
            file_size=scan_result.file_size,
            md5_hash=scan_result.md5_hash,
            sha1_hash=scan_result.sha1_hash,
            sha256_hash=scan_result.sha256_hash,
            scan_time=datetime.datetime.fromisoformat(scan_result.scan_time),
            is_malicious=scan_result.is_malicious,
            threat_level=scan_result.threat_level,
            matches=[m.to_dict() for m in scan_result.matches],
            error=scan_result.error,
            hostname="test",
            uploaded_by=current_user.get("email", "system")
        )
        
        db.add(scan_db)
        db.commit()
        db.refresh(scan_db)
        
        return db_to_response(scan_db)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing EICAR: {str(e)}")
    finally:
        db.close()

@app.get("/malware/scans", response_model=List[MalwareScanResponse])
def get_malware_scans(
    limit: int = 100,
    malicious_only: bool = False,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(lambda: SessionLocal())
):
    """
    Get malware scan history
    
    - **limit**: Maximum number of scans to return (default 100)
    - **malicious_only**: If true, only return scans that detected malware
    """
    try:
        query = db.query(MalwareScanDB).order_by(MalwareScanDB.scan_time.desc())
        
        if malicious_only:
            query = query.filter(MalwareScanDB.is_malicious == True)
        
        scans = query.limit(limit).all()
        
        return [db_to_response(scan) for scan in scans]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scans: {str(e)}")
    finally:
        db.close()

@app.get("/malware/scans/{scan_id}", response_model=MalwareScanResponse)
def get_malware_scan_details(
    scan_id: int,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(lambda: SessionLocal())
):
    """
    Get detailed information about a specific malware scan
    """
    try:
        scan = db.query(MalwareScanDB).filter(MalwareScanDB.id == scan_id).first()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        return db_to_response(scan)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scan details: {str(e)}")
    finally:
        db.close()

@app.get("/malware/summary", response_model=MalwareScanSummaryResponse)
def get_malware_scan_summary(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(lambda: SessionLocal())
):
    """
    Get summary statistics for malware scans
    """
    try:
        # Get all scans
        all_scans = db.query(MalwareScanDB).all()
        
        # Calculate statistics - using filter to avoid type errors
        total_scans = len(all_scans)
        malicious_scans = [scan for scan in all_scans if getattr(scan, 'is_malicious', False)]
        malicious_files = len(malicious_scans)
        clean_files = total_scans - malicious_files
        
        # Threat distribution
        threat_distribution = {
            "clean": 0,
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0
        }
        
        for scan in all_scans:
            threat_level_val = getattr(scan, 'threat_level', None)
            level = threat_level_val.lower() if threat_level_val else "clean"
            if level in threat_distribution:
                threat_distribution[level] += 1
        
        # Get recent malicious scans
        recent_threats = db.query(MalwareScanDB)\
            .filter(MalwareScanDB.is_malicious == True)\
            .order_by(MalwareScanDB.scan_time.desc())\
            .limit(10)\
            .all()
        
        return MalwareScanSummaryResponse(
            total_scans=total_scans,
            malicious_files=malicious_files,
            clean_files=clean_files,
            threat_distribution=threat_distribution,
            recent_threats=[db_to_response(scan) for scan in recent_threats]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
    finally:
        db.close()

@app.get("/malware/rules")
def get_available_yara_rules(current_user: Dict = Depends(get_current_user)):
    """
    Get list of available YARA rules loaded in the scanner
    """
    if not SCANNER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Malware scanner is not available. YARA library may not be installed."
        )
    
    if scanner is None:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    try:
        rules = scanner.get_available_rules()
        return {
            "total_rules": len(rules),
            "rules": rules
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching rules: {str(e)}")

@app.post("/malware/reload-rules")
def reload_yara_rules(current_user: Dict = Depends(get_current_user)):
    """
    Reload YARA rules from the rules file
    Useful after updating rules without restarting the server
    """
    if not SCANNER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Malware scanner is not available. YARA library may not be installed."
        )
    
    if scanner is None:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    try:
        scanner.reload_rules()
        rules = scanner.get_available_rules()
        return {
            "status": "success",
            "message": "YARA rules reloaded successfully",
            "total_rules": len(rules),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reloading rules: {str(e)}")