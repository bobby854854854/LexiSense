from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import logging

from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/overview")
async def get_analytics_overview(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive analytics overview."""
    org_id = current_user["organizationId"]
    today = datetime.now(timezone.utc)
    
    # Basic counts
    total_contracts = await db.contracts.count_documents({"organizationId": org_id})
    active_contracts = await db.contracts.count_documents({"organizationId": org_id, "status": "active"})
    draft_contracts = await db.contracts.count_documents({"organizationId": org_id, "status": "draft"})
    expired_contracts = await db.contracts.count_documents({"organizationId": org_id, "status": "expired"})
    
    # Expiring contracts
    expiring_7d = await db.contracts.count_documents({
        "organizationId": org_id,
        "expiryDate": {"$gte": today.strftime("%Y-%m-%d"), "$lte": (today + timedelta(days=7)).strftime("%Y-%m-%d")},
        "status": {"$ne": "expired"}
    })
    expiring_30d = await db.contracts.count_documents({
        "organizationId": org_id,
        "expiryDate": {"$gte": today.strftime("%Y-%m-%d"), "$lte": (today + timedelta(days=30)).strftime("%Y-%m-%d")},
        "status": {"$ne": "expired"}
    })
    expiring_90d = await db.contracts.count_documents({
        "organizationId": org_id,
        "expiryDate": {"$gte": today.strftime("%Y-%m-%d"), "$lte": (today + timedelta(days=90)).strftime("%Y-%m-%d")},
        "status": {"$ne": "expired"}
    })
    
    # Risk breakdown
    high_risk = await db.contracts.count_documents({"organizationId": org_id, "riskLevel": "high"})
    medium_risk = await db.contracts.count_documents({"organizationId": org_id, "riskLevel": "medium"})
    low_risk = await db.contracts.count_documents({"organizationId": org_id, "riskLevel": "low"})
    
    # By type
    by_type = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id}},
        {"$group": {"_id": "$contractType", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    # Monthly trend (last 6 months)
    six_months_ago = (today - timedelta(days=180)).isoformat()
    monthly_trend = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id, "createdAt": {"$gte": six_months_ago}}},
        {"$project": {
            "month": {"$substr": ["$createdAt", 0, 7]}
        }},
        {"$group": {"_id": "$month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]).to_list(12)
    
    # Team activity
    team_members = await db.users.count_documents({"organizationId": org_id})
    
    uploads_by_user = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id}},
        {"$group": {"_id": "$uploadedBy", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]).to_list(5)
    
    # Get user emails for top uploaders (batch fetch)
    uploader_ids = [item["_id"] for item in uploads_by_user]
    users = await db.users.find({"id": {"$in": uploader_ids}}, {"_id": 0, "id": 1, "email": 1, "firstName": 1, "lastName": 1}).to_list(len(uploader_ids))
    user_map = {u["id"]: u for u in users}
    top_uploaders = []
    for item in uploads_by_user:
        user = user_map.get(item["_id"])
        if user:
            top_uploaders.append({
                "user": user.get("firstName", user["email"].split("@")[0]),
                "email": user["email"],
                "uploads": item["count"]
            })
    
    return {
        "summary": {
            "totalContracts": total_contracts,
            "activeContracts": active_contracts,
            "draftContracts": draft_contracts,
            "expiredContracts": expired_contracts,
            "teamMembers": team_members
        },
        "expiring": {
            "next7Days": expiring_7d,
            "next30Days": expiring_30d,
            "next90Days": expiring_90d
        },
        "riskDistribution": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
            "unassessed": total_contracts - high_risk - medium_risk - low_risk
        },
        "byType": [{"type": item["_id"] or "Unknown", "count": item["count"]} for item in by_type],
        "monthlyTrend": [{"month": item["_id"], "count": item["count"]} for item in monthly_trend],
        "topUploaders": top_uploaders
    }


@router.get("/contracts/{contract_id}/compare/{other_contract_id}")
async def compare_contracts(
    contract_id: str,
    other_contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Compare two contracts side by side."""
    org_id = current_user["organizationId"]
    
    contract1 = await db.contracts.find_one(
        {"id": contract_id, "organizationId": org_id},
        {"_id": 0}
    )
    
    contract2 = await db.contracts.find_one(
        {"id": other_contract_id, "organizationId": org_id},
        {"_id": 0}
    )
    
    if not contract1 or not contract2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both contracts not found"
        )
    
    # Extract comparable fields
    def extract_comparison_data(c):
        analysis = c.get("aiAnalysis", {}) or {}
        return {
            "id": c["id"],
            "title": c.get("title"),
            "contractType": c.get("contractType"),
            "status": c.get("status"),
            "counterparty": c.get("counterparty"),
            "value": c.get("value"),
            "effectiveDate": c.get("effectiveDate"),
            "expiryDate": c.get("expiryDate"),
            "riskLevel": c.get("riskLevel"),
            "summary": analysis.get("summary"),
            "keyTerms": analysis.get("keyTerms", []),
            "risks": analysis.get("risks", []),
            "parties": analysis.get("parties", []),
            "recommendations": analysis.get("recommendations", [])
        }
    
    comparison = {
        "contract1": extract_comparison_data(contract1),
        "contract2": extract_comparison_data(contract2),
        "differences": []
    }
    
    # Find differences
    fields_to_compare = ["contractType", "status", "riskLevel", "value"]
    for field in fields_to_compare:
        val1 = comparison["contract1"].get(field)
        val2 = comparison["contract2"].get(field)
        if val1 != val2:
            comparison["differences"].append({
                "field": field,
                "contract1": val1,
                "contract2": val2
            })
    
    # Compare risk counts
    risks1 = len(comparison["contract1"].get("risks", []))
    risks2 = len(comparison["contract2"].get("risks", []))
    if risks1 != risks2:
        comparison["differences"].append({
            "field": "Number of Risks",
            "contract1": risks1,
            "contract2": risks2
        })
    
    return comparison
