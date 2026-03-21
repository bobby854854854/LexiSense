from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid


class ContractTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizationId: str
    name: str
    description: Optional[str] = None
    contractType: str = "General"
    content: str  # Template text content
    fields: List[Dict[str, Any]] = Field(default_factory=list)  # Customizable fields
    tags: List[str] = Field(default_factory=list)
    isPublic: bool = False  # Shared across organizations
    createdBy: str
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContractTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    contractType: str = "General"
    content: str
    fields: List[Dict[str, Any]] = []
    tags: List[str] = []


class ContractTemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    contractType: str
    content: str
    fields: List[Dict[str, Any]] = []
    tags: List[str] = []
    isPublic: bool
    createdBy: str
    createdByEmail: Optional[str] = None
    createdAt: str
