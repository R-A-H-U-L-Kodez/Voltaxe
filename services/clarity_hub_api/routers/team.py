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
    resource_type: str = None,  # type: ignore
    resource_id: str = None,  # type: ignore
    details: dict = None,  # type: ignore
    ip_address: str = None,  # type: ignore
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
    if not inviter or inviter.role != "Admin":  # type: ignore
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
    await send_invitation_email(  # type: ignore
        email=invite_request.email,
        name=invite_request.name,
        token=token,
        inviter_name=inviter.name  # type: ignore
    )
    
    # Log audit event
    await log_audit_event(  # type: ignore
        db=db,
        user_id=inviter.id,  # type: ignore
        user_email=inviter.email,  # type: ignore
        action="invite_team_member",
        resource_type="team_member",
        resource_id=new_member.id,  # type: ignore
        details={
            "invited_email": invite_request.email,
            "invited_name": invite_request.name,
            "role": invite_request.role
        },
        ip_address=request.client.host if request.client else None  # type: ignore
    )
    
    return TeamMemberResponse(  # type: ignore
        id=new_member.id,  # type: ignore
        email=new_member.email,  # type: ignore
        name=new_member.name,  # type: ignore
        role=new_member.role,  # type: ignore
        status=new_member.status,  # type: ignore
        invited_at=new_member.invited_at,  # type: ignore
        last_active=new_member.last_active,  # type: ignore
        invited_by=inviter.name  # type: ignore
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
        if member.invited_by_id:  # type: ignore
            inviter_obj = db.query(TeamMemberDB).filter(TeamMemberDB.id == member.invited_by_id).first()
            inviter = inviter_obj.name if inviter_obj else None  # type: ignore
        
        response.append(TeamMemberResponse(  # type: ignore
            id=member.id,  # type: ignore
            email=member.email,  # type: ignore
            name=member.name,  # type: ignore
            role=member.role,  # type: ignore
            status=member.status,  # type: ignore
            invited_at=member.invited_at,  # type: ignore
            last_active=member.last_active,  # type: ignore
            invited_by=inviter  # type: ignore
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
        active_members=len([m for m in members if m.status == "active"]),  # type: ignore
        pending_invites=len([m for m in members if m.status == "pending"]),  # type: ignore
        admins=len([m for m in members if m.role == "Admin"]),  # type: ignore
        analysts=len([m for m in members if m.role == "Analyst"]),  # type: ignore
        viewers=len([m for m in members if m.role == "Viewer"])  # type: ignore
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
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()  # type: ignore
    if not admin or admin.role != "Admin":  # type: ignore
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
    if member.id == admin.id and update_request.role:  # type: ignore
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
        member.role = update_request.role  # type: ignore
    
    if update_request.status:
        if update_request.status not in ["active", "pending", "suspended"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )
        member.status = update_request.status  # type: ignore
    
    member.updated_at = datetime.utcnow()  # type: ignore
    db.commit()
    db.refresh(member)
    
    # Log audit event
    await log_audit_event(  # type: ignore
        db=db,
        user_id=admin.id,  # type: ignore
        user_email=admin.email,  # type: ignore
        action="update_team_member",
        resource_type="team_member",
        resource_id=member.id,  # type: ignore
        details={
            "updated_fields": update_request.dict(exclude_none=True),
            "target_email": member.email
        },
        ip_address=request.client.host if request.client else None  # type: ignore
    )
    
    # Get inviter name
    inviter = None
    if member.invited_by_id:  # type: ignore
        inviter_obj = db.query(TeamMemberDB).filter(TeamMemberDB.id == member.invited_by_id).first()
        inviter = inviter_obj.name if inviter_obj else None  # type: ignore
    
    return TeamMemberResponse(  # type: ignore
        id=member.id,  # type: ignore
        email=member.email,  # type: ignore
        name=member.name,  # type: ignore
        role=member.role,  # type: ignore
        status=member.status,  # type: ignore
        invited_at=member.invited_at,  # type: ignore
        last_active=member.last_active,  # type: ignore
        invited_by=inviter  # type: ignore
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
    if not admin or admin.role != "Admin":  # type: ignore
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
    if member.id == admin.id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the team"
        )
    
    # Log audit event before deletion
    await log_audit_event(  # type: ignore
        db=db,
        user_id=admin.id,  # type: ignore
        user_email=admin.email,  # type: ignore
        action="delete_team_member",
        resource_type="team_member",
        resource_id=member.id,  # type: ignore
        details={
            "deleted_email": member.email,
            "deleted_name": member.name,
            "deleted_role": member.role
        },
        ip_address=request.client.host if request.client else None  # type: ignore
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
    if not admin or admin.role != "Admin":  # type: ignore
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
    
    if member.status != "pending":  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend invitations to pending members"
        )
    
    # Generate new token
    new_token = generate_invitation_token()
    member.invitation_token = new_token  # type: ignore
    member.token_expires_at = datetime.utcnow() + timedelta(days=7)  # type: ignore
    db.commit()
    
    # Send email
    await send_invitation_email(  # type: ignore
        email=member.email,  # type: ignore
        name=member.name,  # type: ignore
        token=new_token,
        inviter_name=admin.name  # type: ignore
    )
    
    # Log audit event
    await log_audit_event(  # type: ignore
        db=db,
        user_id=admin.id,  # type: ignore
        user_email=admin.email,  # type: ignore
        action="resend_invitation",
        resource_type="team_member",
        resource_id=member.id,  # type: ignore
        details={"target_email": member.email},
        ip_address=request.client.host if request.client else None  # type: ignore
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
    ).first()  # type: ignore
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token"
        )
    
    # Check if token expired
    if member.token_expires_at and member.token_expires_at < datetime.utcnow():  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired"
        )
    
    # Check if already accepted
    if member.status == "active":  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already accepted"
        )
    
    # Set password and activate account
    member.hashed_password = hash_password(accept_request.password)  # type: ignore
    member.status = "active"  # type: ignore
    member.is_email_verified = True  # type: ignore
    member.invitation_token = None  # Clear token after use  # type: ignore
    member.last_active = datetime.utcnow()  # type: ignore
    db.commit()
    
    # Log audit event
    await log_audit_event(  # type: ignore
        db=db,
        user_id=member.id,  # type: ignore
        user_email=member.email,  # type: ignore
        action="accept_invitation",
        resource_type="team_member",
        resource_id=member.id,  # type: ignore
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
    admin = db.query(TeamMemberDB).filter(TeamMemberDB.email == current_user.get("email")).first()  # type: ignore
    if not admin or admin.role != "Admin":  # type: ignore  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view audit logs"
        )
    
    logs = db.query(AuditLogDB).order_by(
        AuditLogDB.timestamp.desc()
    ).offset(offset).limit(limit).all()  # type: ignore
    
    return [
        AuditLogResponse(  # type: ignore
            id=log.id,  # type: ignore
            timestamp=log.timestamp,  # type: ignore
            user_email=log.user_email,  # type: ignore
            action=log.action,  # type: ignore
            resource_type=log.resource_type,  # type: ignore
            resource_id=log.resource_id,  # type: ignore
            details=log.details,  # type: ignore
            status=log.status  # type: ignore
        )
        for log in logs
    ]
