from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import logging

from models.user import User, UserCreate, UserLogin, UserResponse, TokenResponse
from models.organization import Organization
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

db = None

def init_db(database):
    global db
    db = database


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user and create their organization."""
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    org_name = user_data.organizationName or f"{user_data.email.split('@')[0]}'s Organization"
    org = Organization(name=org_name)
    org_doc = org.model_dump()
    await db.organizations.insert_one(org_doc)
    
    user = User(
        email=user_data.email,
        passwordHash=hash_password(user_data.password),
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        role="admin",
        organizationId=org.id
    )
    user_doc = user.model_dump()
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "organizationId": user.organizationId
        }
    )
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        firstName=user.firstName,
        lastName=user.lastName,
        role=user.role,
        organizationId=user.organizationId,
        isActive=user.isActive,
        lastLogin=user.lastLogin,
        createdAt=user.createdAt
    )
    
    return TokenResponse(access_token=access_token, user=user_response)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate a user and return access token."""
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user_doc["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user_doc.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"lastLogin": datetime.now(timezone.utc).isoformat()}}
    )
    
    access_token = create_access_token(
        data={
            "sub": user_doc["id"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "organizationId": user_doc.get("organizationId")
        }
    )
    
    user_response = UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        firstName=user_doc.get("firstName"),
        lastName=user_doc.get("lastName"),
        role=user_doc["role"],
        organizationId=user_doc.get("organizationId"),
        isActive=user_doc.get("isActive", True),
        lastLogin=datetime.now(timezone.utc).isoformat(),
        createdAt=user_doc["createdAt"]
    )
    
    return TokenResponse(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user's information."""
    user_doc = await db.users.find_one({"id": current_user["sub"]})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        firstName=user_doc.get("firstName"),
        lastName=user_doc.get("lastName"),
        role=user_doc["role"],
        organizationId=user_doc.get("organizationId"),
        isActive=user_doc.get("isActive", True),
        lastLogin=user_doc.get("lastLogin"),
        createdAt=user_doc["createdAt"]
    )


@router.post("/logout")
async def logout():
    """Logout endpoint (client should discard token)."""
    return {"message": "Successfully logged out"}
