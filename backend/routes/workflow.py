from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from datetime import datetime, timezone
import logging

from utils.auth import get_current_user
from services.audit_service import log_action, send_notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contracts", tags=["Workflow"])

db = None

WORKFLOW_TRANSITIONS = {
    "draft": ["review"],
    "review": ["approved", "draft"],
    "approved": ["active", "review"],
    "active": ["expired"],
    "expired": [],
}

WORKFLOW_LABELS = {
    "draft": "Draft",
    "review": "In Review",
    "approved": "Approved",
    "active": "Active",
    "expired": "Expired",
}


def init_db(database):
    global db
    db = database


@router.get("/workflow/states")
async def get_workflow_states(current_user: dict = Depends(get_current_user)):
    """Get available workflow states and their transitions."""
    return {
        "states": list(WORKFLOW_LABELS.keys()),
        "labels": WORKFLOW_LABELS,
        "transitions": WORKFLOW_TRANSITIONS,
    }


@router.post("/{contract_id}/workflow/{action}")
async def workflow_action(
    contract_id: str,
    action: str,
    comment: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Perform a workflow action on a contract.

    Actions: submit_for_review, approve, reject, activate
    """
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0},
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    current_status = contract.get("status", "draft")
    user_role = current_user["role"]

    # Determine new status based on action
    action_map = {
        "submit_for_review": ("review", ["admin", "manager", "user"]),
        "approve": ("approved", ["admin", "manager"]),
        "reject": ("draft", ["admin", "manager"]),
        "activate": ("active", ["admin", "manager"]),
    }

    if action not in action_map:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")

    new_status, allowed_roles = action_map[action]

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{user_role}' cannot perform '{action}'",
        )

    # Validate transition
    allowed = WORKFLOW_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current_status}' to '{new_status}'",
        )

    # Build workflow history entry
    history_entry = {
        "fromStatus": current_status,
        "toStatus": new_status,
        "action": action,
        "userId": current_user["sub"],
        "userEmail": current_user.get("email"),
        "comment": comment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Update contract
    update = {
        "$set": {
            "status": new_status,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        },
        "$push": {"workflowHistory": history_entry},
    }

    if action == "approve":
        update["$set"]["approvedBy"] = current_user["sub"]
        update["$set"]["approvedAt"] = datetime.now(timezone.utc).isoformat()

    await db.contracts.update_one({"id": contract_id}, update)

    # Audit log
    await log_action(
        organization_id=current_user["organizationId"],
        user_id=current_user["sub"],
        user_email=current_user.get("email"),
        action=f"contract_{action}",
        resource_type="contract",
        resource_id=contract_id,
        resource_title=contract.get("title"),
        details={"from": current_status, "to": new_status, "comment": comment},
    )

    # Notify the uploader about status changes
    uploader_id = contract.get("uploadedBy")
    if uploader_id and uploader_id != current_user["sub"]:
        action_labels = {
            "submit_for_review": "submitted for review",
            "approve": "approved",
            "reject": "sent back to draft",
            "activate": "activated",
        }
        await send_notification(
            organization_id=current_user["organizationId"],
            user_id=uploader_id,
            notification_type=f"workflow_{action}",
            title=f"Contract {action_labels.get(action, action)}",
            message=f'"{contract.get("title")}" has been {action_labels.get(action, action)} by {current_user.get("email")}',
            resource_type="contract",
            resource_id=contract_id,
        )

    # If submitted for review, notify admins/managers
    if action == "submit_for_review":
        admins = await db.users.find(
            {
                "organizationId": current_user["organizationId"],
                "role": {"$in": ["admin", "manager"]},
                "id": {"$ne": current_user["sub"]},
            },
            {"_id": 0, "id": 1},
        ).to_list(100)
        for admin in admins:
            await send_notification(
                organization_id=current_user["organizationId"],
                user_id=admin["id"],
                notification_type="workflow_submitted",
                title="Contract submitted for review",
                message=f'"{contract.get("title")}" was submitted for review by {current_user.get("email")}',
                resource_type="contract",
                resource_id=contract_id,
            )

    return {
        "message": f"Contract status changed to '{new_status}'",
        "status": new_status,
        "previousStatus": current_status,
    }


@router.get("/{contract_id}/workflow/history")
async def get_workflow_history(
    contract_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get workflow history for a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0, "workflowHistory": 1, "status": 1},
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return {
        "currentStatus": contract.get("status", "draft"),
        "history": contract.get("workflowHistory", []),
        "transitions": WORKFLOW_TRANSITIONS,
        "labels": WORKFLOW_LABELS,
    }
