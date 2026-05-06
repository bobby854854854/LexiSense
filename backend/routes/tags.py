from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timezone
import logging

from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tags", tags=["Tags"])

db = None

def init_db(database):
    global db
    db = database


@router.get("", response_model=List[str])
async def list_organization_tags(current_user: dict = Depends(get_current_user)):
    """Get all unique tags used across the organization."""
    pipeline = [
        {"$match": {"organizationId": current_user["organizationId"]}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}},
    ]
    results = await db.contracts.aggregate(pipeline).to_list(500)
    return [r["_id"] for r in results]


@router.post("/{contract_id}")
async def add_tags(
    contract_id: str,
    tags: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Add tags to a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0, "id": 1},
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    cleaned = list(set(t.strip().lower() for t in tags if t.strip()))
    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$addToSet": {"tags": {"$each": cleaned}},
            "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()},
        },
    )
    updated = await db.contracts.find_one({"id": contract_id}, {"_id": 0, "tags": 1})
    return {"tags": updated.get("tags", [])}


@router.delete("/{contract_id}/{tag}")
async def remove_tag(
    contract_id: str,
    tag: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a tag from a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0, "id": 1},
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$pull": {"tags": tag},
            "$set": {"updatedAt": datetime.now(timezone.utc).isoformat()},
        },
    )
    updated = await db.contracts.find_one({"id": contract_id}, {"_id": 0, "tags": 1})
    return {"tags": updated.get("tags", [])}


@router.patch("/{contract_id}/category")
async def update_category(
    contract_id: str,
    category: str,
    current_user: dict = Depends(get_current_user),
):
    """Update the category of a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0, "id": 1},
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"category": category, "updatedAt": datetime.now(timezone.utc).isoformat()}},
    )
    return {"category": category}
