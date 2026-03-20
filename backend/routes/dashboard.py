from fastapi import APIRouter, Depends
from typing import Dict, Any
from datetime import datetime, timezone, timedelta
import logging

from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Get dashboard statistics for the organization."""
    org_id = current_user["organizationId"]
    
    total_contracts = await db.contracts.count_documents({"organizationId": org_id})
    
    active_contracts = await db.contracts.count_documents({
        "organizationId": org_id,
        "status": "active"
    })
    
    thirty_days_later = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    today = datetime.now(timezone.utc).isoformat()
    
    expiring_soon = await db.contracts.count_documents({
        "organizationId": org_id,
        "expiryDate": {"$gte": today, "$lte": thirty_days_later}
    })
    
    high_risk = await db.contracts.count_documents({
        "organizationId": org_id,
        "riskLevel": "high"
    })
    
    team_members = await db.users.count_documents({"organizationId": org_id})
    
    recent_contracts = await db.contracts.find(
        {"organizationId": org_id},
        {"_id": 0, "id": 1, "title": 1, "status": 1, "riskLevel": 1, "createdAt": 1, "counterparty": 1}
    ).sort("createdAt", -1).limit(5).to_list(5)
    
    by_status = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    by_risk = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id, "riskLevel": {"$ne": None}}},
        {"$group": {"_id": "$riskLevel", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    by_type = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id}},
        {"$group": {"_id": "$contractType", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    return {
        "overview": {
            "totalContracts": total_contracts,
            "activeContracts": active_contracts,
            "expiringSoon": expiring_soon,
            "highRisk": high_risk,
            "teamMembers": team_members
        },
        "recentContracts": recent_contracts,
        "byStatus": {item["_id"]: item["count"] for item in by_status if item["_id"]},
        "byRisk": {item["_id"]: item["count"] for item in by_risk if item["_id"]},
        "byType": {item["_id"]: item["count"] for item in by_type if item["_id"]}
    }


@router.get("/activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Get recent activity in the organization."""
    org_id = current_user["organizationId"]
    
    recent_contracts = await db.contracts.find(
        {"organizationId": org_id},
        {"_id": 0, "id": 1, "title": 1, "uploadedBy": 1, "createdAt": 1}
    ).sort("createdAt", -1).limit(10).to_list(10)
    
    activity = []
    for contract in recent_contracts:
        uploader = await db.users.find_one(
            {"id": contract["uploadedBy"]},
            {"_id": 0, "email": 1, "firstName": 1, "lastName": 1}
        )
        activity.append({
            "type": "contract_uploaded",
            "contractId": contract["id"],
            "contractTitle": contract["title"],
            "user": uploader,
            "timestamp": contract["createdAt"]
        })
    
    return {"activity": activity}
