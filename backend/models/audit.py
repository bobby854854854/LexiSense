from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizationId: str
    userId: str
    userEmail: Optional[str] = None
    action: str  # contract_uploaded, contract_deleted, contract_approved, team_invite, etc.
    resourceType: str  # contract, team, template, alert, settings
    resourceId: Optional[str] = None
    resourceTitle: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ipAddress: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AuditLogResponse(BaseModel):
    id: str
    userId: str
    userEmail: Optional[str] = None
    action: str
    resourceType: str
    resourceId: Optional[str] = None
    resourceTitle: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    createdAt: str
