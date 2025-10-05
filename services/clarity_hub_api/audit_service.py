"""
Voltaxe Audit Logging Service
Comprehensive audit trail for all security-critical actions and administrative activities.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import json

logger = logging.getLogger(__name__)

Base = declarative_base()

class ActionType(Enum):
    """Types of auditable actions"""
    # Authentication & Authorization
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    
    # Alert Management
    ALERT_ACKNOWLEDGED = "alert_acknowledged"
    ALERT_DISMISSED = "alert_dismissed"
    ALERT_ESCALATED = "alert_escalated"
    
    # Endpoint Management
    ENDPOINT_ISOLATED = "endpoint_isolated"
    ENDPOINT_RESTORED = "endpoint_restored"
    ENDPOINT_SCANNED = "endpoint_scanned"
    
    # Threat Response
    THREAT_MITIGATED = "threat_mitigated"
    PROCESS_KILLED = "process_killed"
    FORENSICS_COLLECTED = "forensics_collected"
    
    # Configuration Changes
    SETTINGS_UPDATED = "settings_updated"
    USER_CREATED = "user_created"
    USER_DELETED = "user_deleted"
    USER_UPDATED = "user_updated"
    ROLE_CHANGED = "role_changed"
    
    # Data Access
    DATA_EXPORTED = "data_exported"
    REPORT_GENERATED = "report_generated"
    SEARCH_PERFORMED = "search_performed"
    
    # System
    SYSTEM_UPDATE = "system_update"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"

class SeverityLevel(Enum):
    """Severity levels for audit events"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AuditLogDB(Base):
    """Database model for audit logs"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String, index=True)
    username = Column(String, index=True)
    action_type = Column(String, index=True)
    action_description = Column(Text)
    severity = Column(String, default=SeverityLevel.INFO.value)
    resource_type = Column(String, index=True)  # endpoint, alert, user, etc.
    resource_id = Column(String, index=True)
    ip_address = Column(String)
    user_agent = Column(String)
    details = Column(JSON)  # Additional structured data
    success = Column(String, default="true")  # "true" or "false"
    error_message = Column(Text, nullable=True)

class AuditService:
    """
    Service for logging and querying audit trails.
    """
    
    def __init__(self, database_url: str = "sqlite:///./voltaxe_audit.db"):
        """Initialize audit service with database connection"""
        self.engine = create_engine(database_url, echo=False)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        logger.info("[AUDIT] Audit logging service initialized")
    
    def log_action(
        self,
        user_id: str,
        username: str,
        action_type: ActionType,
        action_description: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        severity: SeverityLevel = SeverityLevel.INFO,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> int:
        """
        Log an auditable action.
        
        Returns:
            int: The ID of the created audit log entry
        """
        db = self.SessionLocal()
        try:
            audit_entry = AuditLogDB(
                timestamp=datetime.utcnow(),
                user_id=user_id,
                username=username,
                action_type=action_type.value,
                action_description=action_description,
                severity=severity.value,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                details=details or {},
                success="true" if success else "false",
                error_message=error_message
            )
            
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
            
            # Log to console for immediate visibility
            severity_emoji = {
                SeverityLevel.INFO.value: "ℹ️",
                SeverityLevel.WARNING.value: "⚠️",
                SeverityLevel.CRITICAL.value: "🚨"
            }
            
            emoji = severity_emoji.get(severity.value, "📝")
            status = "✅" if success else "❌"
            
            logger.info(
                f"[AUDIT] {emoji} {status} {action_type.value.upper()}: "
                f"{username} - {action_description}"
            )
            
            return audit_entry.id
            
        except Exception as e:
            logger.error(f"[AUDIT] Failed to log action: {e}")
            db.rollback()
            raise
        finally:
            db.close()
    
    def get_logs(
        self,
        user_id: Optional[str] = None,
        action_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        severity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query audit logs with filters.
        """
        db = self.SessionLocal()
        try:
            query = db.query(AuditLogDB)
            
            # Apply filters
            if user_id:
                query = query.filter(AuditLogDB.user_id == user_id)
            
            if action_type:
                query = query.filter(AuditLogDB.action_type == action_type)
            
            if resource_type:
                query = query.filter(AuditLogDB.resource_type == resource_type)
            
            if resource_id:
                query = query.filter(AuditLogDB.resource_id == resource_id)
            
            if severity:
                query = query.filter(AuditLogDB.severity == severity)
            
            if start_date:
                query = query.filter(AuditLogDB.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLogDB.timestamp <= end_date)
            
            if search:
                search_filter = f"%{search}%"
                query = query.filter(
                    (AuditLogDB.action_description.like(search_filter)) |
                    (AuditLogDB.username.like(search_filter)) |
                    (AuditLogDB.resource_id.like(search_filter))
                )
            
            # Order by most recent first
            query = query.order_by(AuditLogDB.timestamp.desc())
            
            # Get total count before pagination
            total_count = query.count()
            
            # Apply pagination
            logs = query.limit(limit).offset(offset).all()
            
            # Convert to dict
            result = []
            for log in logs:
                result.append({
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "user_id": log.user_id,
                    "username": log.username,
                    "action_type": log.action_type,
                    "action_description": log.action_description,
                    "severity": log.severity,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "details": log.details,
                    "success": log.success == "true",
                    "error_message": log.error_message
                })
            
            return result
            
        finally:
            db.close()
    
    def get_log_by_id(self, log_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific audit log by ID"""
        db = self.SessionLocal()
        try:
            log = db.query(AuditLogDB).filter(AuditLogDB.id == log_id).first()
            
            if not log:
                return None
            
            return {
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "user_id": log.user_id,
                "username": log.username,
                "action_type": log.action_type,
                "action_description": log.action_description,
                "severity": log.severity,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "details": log.details,
                "success": log.success == "true",
                "error_message": log.error_message
            }
        finally:
            db.close()
    
    def get_user_activity(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get activity summary for a user"""
        db = self.SessionLocal()
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = db.query(AuditLogDB).filter(
                AuditLogDB.user_id == user_id,
                AuditLogDB.timestamp >= start_date
            ).all()
            
            # Calculate statistics
            total_actions = len(logs)
            action_types = {}
            severity_counts = {"info": 0, "warning": 0, "critical": 0}
            failed_actions = 0
            
            for log in logs:
                # Count action types
                action_types[log.action_type] = action_types.get(log.action_type, 0) + 1
                
                # Count severity
                if log.severity in severity_counts:
                    severity_counts[log.severity] += 1
                
                # Count failures
                if log.success == "false":
                    failed_actions += 1
            
            return {
                "user_id": user_id,
                "period_days": days,
                "total_actions": total_actions,
                "failed_actions": failed_actions,
                "action_types": action_types,
                "severity_counts": severity_counts,
                "last_activity": logs[0].timestamp.isoformat() if logs else None
            }
            
        finally:
            db.close()
    
    def get_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get overall audit log statistics"""
        db = self.SessionLocal()
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = db.query(AuditLogDB).filter(
                AuditLogDB.timestamp >= start_date
            ).all()
            
            # Calculate statistics
            total_logs = len(logs)
            unique_users = len(set(log.user_id for log in logs))
            action_types = {}
            severity_counts = {"info": 0, "warning": 0, "critical": 0}
            failed_actions = 0
            resource_types = {}
            
            for log in logs:
                # Count action types
                action_types[log.action_type] = action_types.get(log.action_type, 0) + 1
                
                # Count severity
                if log.severity in severity_counts:
                    severity_counts[log.severity] += 1
                
                # Count failures
                if log.success == "false":
                    failed_actions += 1
                
                # Count resource types
                if log.resource_type:
                    resource_types[log.resource_type] = resource_types.get(log.resource_type, 0) + 1
            
            return {
                "period_days": days,
                "total_logs": total_logs,
                "unique_users": unique_users,
                "failed_actions": failed_actions,
                "action_types": action_types,
                "severity_counts": severity_counts,
                "resource_types": resource_types
            }
            
        finally:
            db.close()
    
    def export_logs(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = "json"
    ) -> str:
        """
        Export audit logs for compliance reporting.
        
        Args:
            start_date: Start date for export
            end_date: End date for export
            format: Export format (json or csv)
        
        Returns:
            str: Exported data as string
        """
        logs = self.get_logs(
            start_date=start_date,
            end_date=end_date,
            limit=10000  # Large limit for export
        )
        
        if format == "json":
            return json.dumps(logs, indent=2)
        elif format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if logs:
                fieldnames = logs[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(logs)
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported export format: {format}")

# Global audit service instance
audit_service = AuditService()

# Helper function for easy access
def log_audit(
    user_id: str,
    username: str,
    action_type: ActionType,
    description: str,
    **kwargs
) -> int:
    """Convenience function to log audit events"""
    return audit_service.log_action(
        user_id=user_id,
        username=username,
        action_type=action_type,
        action_description=description,
        **kwargs
    )
