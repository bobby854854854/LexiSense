from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizationId: str
    userId: str  # recipient
    type: str  # workflow_submitted, workflow_approved, workflow_rejected, team_invite, expiration_warning, contract_assigned
    title: str
    message: str
    resourceType: Optional[str] = None  # contract, team, alert
    resourceId: Optional[str] = None
    isRead: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    resourceType: Optional[str] = None
    resourceId: Optional[str] = None
    isRead: bool
    createdAt: str
