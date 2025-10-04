"""
Team Management Models
Defines database models and schemas for team member management
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
from database import Base

class TeamMemberDB(Base):
    """Database model for team members"""
    __tablename__ = "team_members"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Analyst, Viewer
    status = Column(String, nullable=False, default="pending")  # active, pending, suspended
    invited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    invited_by_id = Column(String, ForeignKey('team_members.id'), nullable=True)
    last_active = Column(DateTime, nullable=True)
    invitation_token = Column(String, unique=True, nullable=True, index=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User credentials (for authentication)
    hashed_password = Column(String, nullable=True)  # Only set after accepting invite
    is_email_verified = Column(Boolean, default=False)


class AuditLogDB(Base):
    """Database model for audit logging"""
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(String, ForeignKey('team_members.id'), nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    details = Column(String, nullable=True)  # JSON string
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status = Column(String, nullable=False, default="success")  # success, failed, partial


# --- Pydantic Request/Response Models ---

class InviteTeamMemberRequest(BaseModel):
    """Request model for inviting a team member"""
    email: EmailStr
    name: str
    role: str  # Admin, Analyst, Viewer
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "analyst@company.com",
                "name": "John Doe",
                "role": "Analyst"
            }
        }


class TeamMemberResponse(BaseModel):
    """Response model for team member data"""
    id: str
    email: str
    name: str
    role: str
    status: str
    invited_at: datetime
    last_active: Optional[datetime] = None
    invited_by: Optional[str] = None  # Inviter's name
    
    class Config:
        from_attributes = True


class UpdateTeamMemberRequest(BaseModel):
    """Request model for updating team member"""
    role: Optional[str] = None
    status: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "Admin",
                "status": "active"
            }
        }


class AcceptInviteRequest(BaseModel):
    """Request model for accepting invitation"""
    token: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "password": "SecurePassword123!"
            }
        }


class ResendInviteRequest(BaseModel):
    """Request model for resending invitation"""
    member_id: str


class TeamStatsResponse(BaseModel):
    """Response model for team statistics"""
    total_members: int
    active_members: int
    pending_invites: int
    admins: int
    analysts: int
    viewers: int


class AuditLogResponse(BaseModel):
    """Response model for audit log entries"""
    id: str
    timestamp: datetime
    user_email: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    status: str
    
    class Config:
        from_attributes = True
