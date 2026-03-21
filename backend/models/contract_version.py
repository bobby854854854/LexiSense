from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid


class ContractVersion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contractId: str
    version: int
    title: str
    counterparty: Optional[str] = None
    contractType: str
    status: str
    value: Optional[str] = None
    effectiveDate: Optional[str] = None
    expiryDate: Optional[str] = None
    riskLevel: Optional[str] = None
    originalText: Optional[str] = None
    aiAnalysis: Optional[Dict[str, Any]] = None
    changedBy: str
    changeReason: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContractVersionResponse(BaseModel):
    id: str
    contractId: str
    version: int
    title: str
    status: str
    changedBy: str
    changedByEmail: Optional[str] = None
    changeReason: Optional[str] = None
    createdAt: str
