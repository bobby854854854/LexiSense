from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timezone
import logging

from models.user import User, UserResponse
from models.invitation import Invitation, InvitationCreate, InvitationResponse
from utils.auth import get_current_user, hash_password
from services.email_service import send_invitation_email
from services.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/team", tags=["Team"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/members", response_model=List[UserResponse])
async def list_team_members(current_user: dict = Depends(get_current_user)):
    """List all team members in the organization."""
    members = await db.users.find(
        {"organizationId": current_user["organizationId"]},
        {"_id": 0, "passwordHash": 0}
    ).to_list(1000)
    
    return [
        UserResponse(
            id=m["id"],
            email=m["email"],
            firstName=m.get("firstName"),
            lastName=m.get("lastName"),
            role=m["role"],
            organizationId=m.get("organizationId"),
            isActive=m.get("isActive", True),
            lastLogin=m.get("lastLogin"),
            createdAt=m["createdAt"]
        )
        for m in members
    ]


@router.post("/invite", response_model=InvitationResponse)
async def invite_member(
    invitation_data: InvitationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Invite a new member to the organization."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can invite new members"
        )
    
    existing_user = await db.users.find_one({"email": invitation_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    existing_invite = await db.invitations.find_one({
        "email": invitation_data.email,
        "organizationId": current_user["organizationId"],
        "status": "pending"
    })
    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent to this email"
        )
    
    invitation = Invitation(
        organizationId=current_user["organizationId"],
        email=invitation_data.email,
        role=invitation_data.role,
        invitedBy=current_user["sub"]
    )
    
    invite_doc = invitation.model_dump()
    await db.invitations.insert_one(invite_doc)
    
    # Get inviter details and organization name
    inviter = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "firstName": 1, "lastName": 1, "email": 1})
    org = await db.organizations.find_one({"id": current_user["organizationId"]}, {"_id": 0, "name": 1})
    
    inviter_name = f"{inviter.get('firstName', '')} {inviter.get('lastName', '')}".strip() or inviter.get("email", "Team member")
    org_name = org.get("name", "the organization") if org else "the organization"
    
    # Send invitation email
    email_result = await send_invitation_email(
        to_email=invitation_data.email,
        inviter_name=inviter_name,
        organization_name=org_name,
        role=invitation_data.role,
        token=invitation.token
    )
    
    logger.info(f"Invitation created for {invitation_data.email} with token {invitation.token}, email: {email_result}")
    
    await log_action(
        organization_id=current_user["organizationId"],
        user_id=current_user["sub"],
        user_email=current_user.get("email"),
        action="team_invite_sent",
        resource_type="team",
        resource_id=invitation.id,
        resource_title=invitation_data.email,
        details={"role": invitation_data.role},
    )
    
    return InvitationResponse(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        expiresAt=invitation.expiresAt,
        createdAt=invitation.createdAt
    )


@router.get("/invitations", response_model=List[InvitationResponse])
async def list_invitations(current_user: dict = Depends(get_current_user)):
    """List all pending invitations for the organization."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view invitations"
        )
    
    invitations = await db.invitations.find(
        {"organizationId": current_user["organizationId"]},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    return [
        InvitationResponse(
            id=inv["id"],
            email=inv["email"],
            role=inv["role"],
            status=inv["status"],
            expiresAt=inv["expiresAt"],
            createdAt=inv["createdAt"]
        )
        for inv in invitations
    ]


@router.post("/accept-invite")
async def accept_invitation(
    token: str,
    password: str,
    firstName: str = None,
    lastName: str = None
):
    """Accept an invitation and create user account."""
    invitation = await db.invitations.find_one({"token": token, "status": "pending"})
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invitation"
        )
    
    if datetime.fromisoformat(invitation["expiresAt"]) < datetime.now(timezone.utc):
        await db.invitations.update_one(
            {"id": invitation["id"]},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    user = User(
        email=invitation["email"],
        passwordHash=hash_password(password),
        firstName=firstName,
        lastName=lastName,
        role=invitation["role"],
        organizationId=invitation["organizationId"]
    )
    
    user_doc = user.model_dump()
    await db.users.insert_one(user_doc)
    
    await db.invitations.update_one(
        {"id": invitation["id"]},
        {"$set": {"status": "accepted"}}
    )
    
    return {"message": "Account created successfully", "email": user.email}


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a pending invitation."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can cancel invitations"
        )
    
    result = await db.invitations.delete_one({
        "id": invitation_id,
        "organizationId": current_user["organizationId"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    return {"message": "Invitation cancelled"}


@router.patch("/members/{member_id}/role")
async def update_member_role(
    member_id: str,
    role: str,
    current_user: dict = Depends(get_current_user)
):
    """Update a team member's role."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update roles"
        )
    
    if member_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    if role not in ["admin", "manager", "user", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be admin, manager, user, or viewer"
        )
    
    result = await db.users.update_one(
        {"id": member_id, "organizationId": current_user["organizationId"]},
        {"$set": {"role": role, "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    return {"message": "Role updated successfully"}


@router.delete("/members/{member_id}")
async def remove_member(
    member_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a team member from the organization."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove members"
        )
    
    if member_id == current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself"
        )
    
    result = await db.users.delete_one({
        "id": member_id,
        "organizationId": current_user["organizationId"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    return {"message": "Member removed successfully"}
