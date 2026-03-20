from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    organizationName: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    passwordHash: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: str = "user"
    organizationId: Optional[str] = None
    isActive: bool = True
    lastLogin: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserResponse(BaseModel):
    id: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: str
    organizationId: Optional[str] = None
    isActive: bool
    lastLogin: Optional[str] = None
    createdAt: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
