from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, Any, List
from database import get_db
from auth_service import get_current_user

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results per category"),
    type_filter: Optional[str] = Query(None, description="Filter by type: endpoint, alert, cve, malware, event"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Global search across all data types.
    Searches endpoints, alerts, CVEs, malware scans, and events.
    """
    query_param = f"%{q.lower().strip()}%"
    results = {
        "endpoints": [],
        "alerts": [],
        "cves": [],
        "malware": [],
        "events": []
    }

    # Search Endpoints (Snapshots)
    if not type_filter or type_filter == "endpoint":
        sql = text("""
            SELECT id, hostname, timestamp, resilience_score, risk_category
            FROM snapshots
            WHERE LOWER(hostname) LIKE :query
            LIMIT :limit
        """)
        endpoint_rows = db.execute(sql, {"query": query_param, "limit": limit}).fetchall()
        
        results["endpoints"] = [{
            "id": row.id,
            "hostname": row.hostname,
            "ip_address": None,
            "os": None,
            "status": "active",
            "last_seen": row.timestamp.isoformat() if row.timestamp else None
        } for row in endpoint_rows]

    # Search Alerts (Events)
    if not type_filter or type_filter == "alert":
        sql = text("""
            SELECT id, event_type, hostname, details, timestamp
            FROM events
            WHERE LOWER(event_type) LIKE :query OR LOWER(hostname) LIKE :query
            ORDER BY timestamp DESC
            LIMIT :limit
        """)
        alert_rows = db.execute(sql, {"query": query_param, "limit": limit}).fetchall()
        
        results["alerts"] = [{
            "id": row.id,
            "event_type": row.event_type,
            "hostname": row.hostname,
            "severity": "high" if row.event_type and "suspicious" in row.event_type.lower() else "medium",
            "details": str(row.details) if row.details else row.event_type,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None
        } for row in alert_rows]

    # Search CVEs
    if not type_filter or type_filter == "cve":
        sql = text("""
            SELECT id, cve_id, description, severity, published_date
            FROM cve_database
            WHERE LOWER(cve_id) LIKE :query OR LOWER(description) LIKE :query
            ORDER BY published_date DESC
            LIMIT :limit
        """)
        cve_rows = db.execute(sql, {"query": query_param, "limit": limit}).fetchall()
        
        results["cves"] = [{
            "id": row.id,
            "cve_id": row.cve_id,
            "description": row.description,
            "severity": row.severity,
            "hostname": None,
            "detected_at": row.published_date.isoformat() if row.published_date else None
        } for row in cve_rows]

    # Search Malware Scans
    if not type_filter or type_filter == "malware":
        sql = text("""
            SELECT id, file_name, is_malicious, scan_time
            FROM malware_scans
            WHERE LOWER(file_name) LIKE :query
            ORDER BY scan_time DESC
            LIMIT :limit
        """)
        malware_rows = db.execute(sql, {"query": query_param, "limit": limit}).fetchall()
        
        results["malware"] = [{
            "id": row.id,
            "file_name": row.file_name,
            "file_path": None,
            "is_malicious": row.is_malicious,
            "malware_family": None,
            "scan_time": row.scan_time.isoformat() if row.scan_time else None
        } for row in malware_rows]

    # Search Live Events (same as alerts)
    if not type_filter or type_filter == "event":
        sql = text("""
            SELECT id, event_type, hostname, details, timestamp
            FROM events
            WHERE LOWER(event_type) LIKE :query OR LOWER(hostname) LIKE :query
            ORDER BY timestamp DESC
            LIMIT :limit
        """)
        event_rows = db.execute(sql, {"query": query_param, "limit": limit}).fetchall()
        
        results["events"] = [{
            "id": row.id,
            "type": row.event_type,
            "hostname": row.hostname,
            "details": str(row.details) if row.details else row.event_type,
            "severity": None,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None
        } for row in event_rows]

    # Count total results
    total_results = sum(len(v) for v in results.values())
    
    return {
        **results,
        "total_results": total_results,
        "query": q
    }

