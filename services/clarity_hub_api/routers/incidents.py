from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import get_db
from auth_service import get_current_user
from incident_correlator import IncidentCorrelator

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("/")
async def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status: open, investigating, resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    hours: int = Query(24, description="Time window in hours"),
    limit: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get correlated security incidents from recent alerts.
    Automatically groups related alerts into unified incidents.
    """
    try:
        # Fetch recent alerts
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        sql = text("""
            SELECT 
                id,
                event_type,
                hostname,
                details,
                timestamp,
                severity
            FROM events
            WHERE timestamp >= :time_threshold
            ORDER BY timestamp DESC
            LIMIT :limit
        """)
        
        result = db.execute(sql, {
            "time_threshold": time_threshold,
            "limit": limit * 2  # Get more alerts for better correlation
        })
        
        alerts = []
        for row in result:
            alert = {
                'id': row.id,
                'event_type': row.event_type,
                'hostname': row.hostname,
                'details': str(row.details) if row.details else '',
                'timestamp': row.timestamp,
                'severity': row.severity if hasattr(row, 'severity') else 'medium'
            }
            alerts.append(alert)
        
        # Correlate alerts into incidents
        correlator = IncidentCorrelator()
        incidents = correlator.correlate_alerts(alerts)
        
        # Apply filters
        if status:
            incidents = [i for i in incidents if i.get('status', '').lower() == status.lower()]
        
        if severity:
            incidents = [i for i in incidents if i.get('severity', '').lower() == severity.lower()]
        
        # Limit results
        incidents = incidents[:limit]
        
        return {
            "incidents": incidents,
            "total_incidents": len(incidents),
            "total_alerts": len(alerts),
            "time_window_hours": hours,
            "correlation_summary": {
                "alert_reduction": f"{((len(alerts) - len(incidents)) / len(alerts) * 100):.1f}%" if alerts else "0%",
                "avg_alerts_per_incident": round(len(alerts) / len(incidents), 1) if incidents else 0
            }
        }
        
    except Exception as e:
        print(f"Error fetching incidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{incident_id}")
async def get_incident_details(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific incident.
    """
    try:
        # Fetch all alerts to regenerate incidents (in production, you'd store incidents)
        sql = text("""
            SELECT 
                id,
                event_type,
                hostname,
                details,
                timestamp,
                severity
            FROM events
            ORDER BY timestamp DESC
            LIMIT 500
        """)
        
        result = db.execute(sql)
        
        alerts = []
        for row in result:
            alert = {
                'id': row.id,
                'event_type': row.event_type,
                'hostname': row.hostname,
                'details': str(row.details) if row.details else '',
                'timestamp': row.timestamp,
                'severity': row.severity if hasattr(row, 'severity') else 'medium'
            }
            alerts.append(alert)
        
        # Correlate and find the incident
        correlator = IncidentCorrelator()
        incidents = correlator.correlate_alerts(alerts)
        
        # Find matching incident
        incident = next((i for i in incidents if i['incident_id'] == incident_id), None)
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Add timeline
        incident['timeline'] = sorted(
            [
                {
                    'time': alert['timestamp'],
                    'event': alert['event_type'],
                    'hostname': alert['hostname'],
                    'details': alert['details'][:100]
                }
                for alert in incident['alerts']
            ],
            key=lambda x: x['time']
        )
        
        return incident
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching incident details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_incident_stats(
    hours: int = Query(24, description="Time window in hours"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get incident statistics and correlation metrics.
    """
    try:
        # Fetch recent alerts
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        sql = text("""
            SELECT 
                id,
                event_type,
                hostname,
                details,
                timestamp,
                severity
            FROM events
            WHERE timestamp >= :time_threshold
            ORDER BY timestamp DESC
        """)
        
        result = db.execute(sql, {"time_threshold": time_threshold})
        
        alerts = []
        for row in result:
            alert = {
                'id': row.id,
                'event_type': row.event_type,
                'hostname': row.hostname,
                'details': str(row.details) if row.details else '',
                'timestamp': row.timestamp,
                'severity': row.severity if hasattr(row, 'severity') else 'medium'
            }
            alerts.append(alert)
        
        # Correlate
        correlator = IncidentCorrelator()
        incidents = correlator.correlate_alerts(alerts)
        
        # Calculate statistics
        severity_dist = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        kill_chain_stages = {}
        multi_host_incidents = 0
        
        for incident in incidents:
            severity_dist[incident['severity']] = severity_dist.get(incident['severity'], 0) + 1
            
            stage = incident.get('kill_chain_stage', 'Unknown')
            kill_chain_stages[stage] = kill_chain_stages.get(stage, 0) + 1
            
            if len(incident.get('affected_hosts', [])) > 1:
                multi_host_incidents += 1
        
        return {
            "total_alerts": len(alerts),
            "total_incidents": len(incidents),
            "alert_reduction_percent": round(((len(alerts) - len(incidents)) / len(alerts) * 100), 1) if alerts else 0,
            "avg_alerts_per_incident": round(len(alerts) / len(incidents), 1) if incidents else 0,
            "severity_distribution": severity_dist,
            "kill_chain_stages": kill_chain_stages,
            "multi_host_incidents": multi_host_incidents,
            "time_window_hours": hours
        }
        
    except Exception as e:
        print(f"Error calculating incident stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
