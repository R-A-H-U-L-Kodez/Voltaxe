"""
Team Management Router
Handles all team member management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import secrets
import hashlib
from datetime import datetime, timedelta
import os
import json

from models.team import (
    TeamMemberDB, AuditLogDB,
    InviteTeamMemberRequest, TeamMemberResponse, UpdateTeamMemberRequest,
    AcceptInviteRequest, ResendInviteRequest, TeamStatsResponse, AuditLogResponse
)
from auth_service import get_current_user
from database import get_db

router = APIRouter(prefix="/api/team", tags=["Team Management"])


async def log_audit_event(
    db: Session,
    user_id: str,
    user_email: str,
    action: str,
    resource_type: str = None,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = None,
    status: str = "success"
):
    """Helper function to log audit events"""
    audit_log = AuditLogDB(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
        status=status
    )
    db.add(audit_log)
    db.commit()


def generate_invitation_token() -> str:
    """Generate a secure invitation token"""
    return secrets.token_urlsafe(32)


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


async def send_invitation_email(email: str, name: str, token: str, inviter_name: str):
    """
    Send invitation email to new team member
    TODO: Integrate with SendGrid
    """
    # For now, just log the invitation
    invitation_url = f"{os.getenv('APP_URL', 'http://localhost')}/accept-invite?token={token}"
    
    print(f"""
    =====================================
    INVITATION EMAIL
    =====================================
    To: {email}
    Subject: You've been invited to join Voltaxe Security Platform
    
    Hi {name},
    
    {inviter_name} has invited you to join their team on Voltaxe Security Platform.
    
    Click the link below to accept the invitation and set up your account:
    {invitation_url}
    
    This link will expire in 7 days.
    
    Role: Will be assigned after accepting
    
    Best regards,
    Voltaxe Team
    =====================================
    """)
    
    # TODO: Implement actual email sending
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # 
    # message = Mail(
    #     from_email='noreply@voltaxe.com',
    #     to_emails=email,
    #     subject='Invitation to Voltaxe Security Platform',
    #     html_content=render_template('invitation.html', ...)
    # )
    # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    # sg.send(message)


@router.post("/invite", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    request: Request,
    invite_request: InviteTeamMemberRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Invite a new team member
    Only Admins can invite new members
    """
    # Check if current user is Admin
    inviter = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()
    if not inviter or inviter.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can invite team members"
        )
    
    # Validate role
    if invite_request.role not in ["Admin", "Analyst", "Viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be Admin, Analyst, or Viewer"
        )
    
    # Check if user already exists
    existing_member = db.query(TeamMemberDB).filter(TeamMemberDB.email == invite_request.email).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Generate invitation token
    token = generate_invitation_token()
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create new team member
    new_member = TeamMemberDB(
        email=invite_request.email,
        name=invite_request.name,
        role=invite_request.role,
        status="pending",
        invited_by_id=inviter.id,
        invitation_token=token,
        token_expires_at=token_expires_at
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Send invitation email
    await send_invitation_email(
        email=invite_request.email,
        name=invite_request.name,
        token=token,
        inviter_name=inviter.name
    )
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=inviter.id,
        user_email=inviter.email,
        action="invite_team_member",
        resource_type="team_member",
        resource_id=new_member.id,
        details={
            "invited_email": invite_request.email,
            "invited_name": invite_request.name,
            "role": invite_request.role
        },
        ip_address=request.client.host if request.client else None
    )
    
    return TeamMemberResponse(
        id=new_member.id,
        email=new_member.email,
        name=new_member.name,
        role=new_member.role,
        status=new_member.status,
        invited_at=new_member.invited_at,
        last_active=new_member.last_active,
        invited_by=inviter.name
    )


@router.get("/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all team members
    All authenticated users can view team members
    """
    members = db.query(TeamMemberDB).all()
    
    response = []
    for member in members:
        inviter = None
        if member.invited_by_id:
            inviter_obj = db.query(TeamMemberDB).filter(TeamMemberDB.id == member.invited_by_id).first()
            inviter = inviter_obj.name if inviter_obj else None
        
        response.append(TeamMemberResponse(
            id=member.id,
            email=member.email,
            name=member.name,
            role=member.role,
            status=member.status,
            invited_at=member.invited_at,
            last_active=member.last_active,
            invited_by=inviter
        ))
    
    return response


@router.get("/stats", response_model=TeamStatsResponse)
async def get_team_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get team statistics"""
    members = db.query(TeamMemberDB).all()
    
    return TeamStatsResponse(
        total_members=len(members),
        active_members=len([m for m in members if m.status == "active"]),
        pending_invites=len([m for m in members if m.status == "pending"]),
        admins=len([m for m in members if m.role == "Admin"]),
        analysts=len([m for m in members if m.role == "Analyst"]),
        viewers=len([m for m in members if m.role == "Viewer"])
    )


@router.put("/members/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: str,
    request: Request,
    update_request: UpdateTeamMemberRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update team member role or status
    Only Admins can update team members
    """
    # Check if current user is Admin
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update team members"
        )
    
    # Get member to update
    member = db.query(TeamMemberDB).filter(TeamMemberDB.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    # Prevent admins from modifying their own role
    if member.id == admin.id and update_request.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )
    
    # Update fields
    if update_request.role:
        if update_request.role not in ["Admin", "Analyst", "Viewer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        member.role = update_request.role
    
    if update_request.status:
        if update_request.status not in ["active", "pending", "suspended"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )
        member.status = update_request.status
    
    member.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(member)
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=admin.id,
        user_email=admin.email,
        action="update_team_member",
        resource_type="team_member",
        resource_id=member.id,
        details={
            "updated_fields": update_request.dict(exclude_none=True),
            "target_email": member.email
        },
        ip_address=request.client.host if request.client else None
    )
    
    # Get inviter name
    inviter = None
    if member.invited_by_id:
        inviter_obj = db.query(TeamMemberDB).filter(TeamMemberDB.id == member.invited_by_id).first()
        inviter = inviter_obj.name if inviter_obj else None
    
    return TeamMemberResponse(
        id=member.id,
        email=member.email,
        name=member.name,
        role=member.role,
        status=member.status,
        invited_at=member.invited_at,
        last_active=member.last_active,
        invited_by=inviter
    )


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team_member(
    member_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Remove a team member
    Only Admins can remove team members
    """
    # Check if current user is Admin
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can remove team members"
        )
    
    # Get member to delete
    member = db.query(TeamMemberDB).filter(TeamMemberDB.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    # Prevent admins from deleting themselves
    if member.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the team"
        )
    
    # Log audit event before deletion
    await log_audit_event(
        db=db,
        user_id=admin.id,
        user_email=admin.email,
        action="delete_team_member",
        resource_type="team_member",
        resource_id=member.id,
        details={
            "deleted_email": member.email,
            "deleted_name": member.name,
            "deleted_role": member.role
        },
        ip_address=request.client.host if request.client else None
    )
    
    # Delete member
    db.delete(member)
    db.commit()
    
    return None


@router.post("/resend-invite/{member_id}")
async def resend_invitation(
    member_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Resend invitation to a pending team member
    Only Admins can resend invitations
    """
    # Check if current user is Admin
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can resend invitations"
        )
    
    # Get member
    member = db.query(TeamMemberDB).filter(TeamMemberDB.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    if member.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend invitations to pending members"
        )
    
    # Generate new token
    new_token = generate_invitation_token()
    member.invitation_token = new_token
    member.token_expires_at = datetime.utcnow() + timedelta(days=7)
    db.commit()
    
    # Send email
    await send_invitation_email(
        email=member.email,
        name=member.name,
        token=new_token,
        inviter_name=admin.name
    )
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=admin.id,
        user_email=admin.email,
        action="resend_invitation",
        resource_type="team_member",
        resource_id=member.id,
        details={"target_email": member.email},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Invitation resent successfully"}


@router.post("/accept-invite")
async def accept_invitation(
    accept_request: AcceptInviteRequest,
    db: Session = Depends(get_db)
):
    """
    Accept team invitation and create account
    Public endpoint (no authentication required)
    """
    # Find member by token
    member = db.query(TeamMemberDB).filter(
        TeamMemberDB.invitation_token == accept_request.token
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token"
        )
    
    # Check if token expired
    if member.token_expires_at and member.token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired"
        )
    
    # Check if already accepted
    if member.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already accepted"
        )
    
    # Set password and activate account
    member.hashed_password = hash_password(accept_request.password)
    member.status = "active"
    member.is_email_verified = True
    member.invitation_token = None  # Clear token after use
    member.last_active = datetime.utcnow()
    db.commit()
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=member.id,
        user_email=member.email,
        action="accept_invitation",
        resource_type="team_member",
        resource_id=member.id,
        details={"email": member.email}
    )
    
    return {
        "message": "Invitation accepted successfully",
        "email": member.email,
        "name": member.name
    }


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get audit logs
    Only Admins can view audit logs
    """
    # Check if current user is Admin
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()
    if not admin or admin.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view audit logs"
        )
    
    logs = db.query(AuditLogDB).order_by(
        AuditLogDB.timestamp.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        AuditLogResponse(
            id=log.id,
            timestamp=log.timestamp,
            user_email=log.user_email,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            details=log.details,
            status=log.status
        )
        for log in logs
    ]
