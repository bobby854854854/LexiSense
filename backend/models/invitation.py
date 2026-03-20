from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import secrets


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "user"


class Invitation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizationId: str
    email: str
    role: str = "user"
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    status: str = "pending"
    invitedBy: str
    expiresAt: str = Field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(days=7)).isoformat())
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvitationResponse(BaseModel):
    id: str
    email: str
    role: str
    status: str
    expiresAt: str
    createdAt: str
