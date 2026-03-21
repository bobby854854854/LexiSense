from fastapi import APIRouter, Depends
from typing import List, Optional
import logging

from models.audit import AuditLogResponse
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit"])

db = None

def init_db(database):
    global db
    db = database


@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
):
    """List audit logs for the organization. Admin only."""
    if current_user["role"] not in ("admin", "manager"):
        return []

    query = {"organizationId": current_user["organizationId"]}
    if resource_type:
        query["resourceType"] = resource_type
    if action:
        query["action"] = action

    logs = (
        await db.audit_logs.find(query, {"_id": 0})
        .sort("createdAt", -1)
        .limit(limit)
        .to_list(limit)
    )

    return [
        AuditLogResponse(
            id=l["id"],
            userId=l["userId"],
            userEmail=l.get("userEmail"),
            action=l["action"],
            resourceType=l["resourceType"],
            resourceId=l.get("resourceId"),
            resourceTitle=l.get("resourceTitle"),
            details=l.get("details"),
            createdAt=l["createdAt"],
        )
        for l in logs
    ]
