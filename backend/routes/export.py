from fastapi import APIRouter, Depends
from fastapi.responses import Response
from typing import Optional
import logging

from utils.auth import get_current_user
from services.pdf_export_service import generate_contract_pdf, generate_analytics_pdf

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["Export"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/contract/{contract_id}/pdf")
async def export_contract_pdf(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Export a contract as PDF."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0}
    )
    
    if not contract:
        return Response(content="Contract not found", status_code=404)
    
    pdf_bytes = generate_contract_pdf(contract)
    
    filename = f"{contract.get('title', 'contract').replace(' ', '_')}_report.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/analytics/pdf")
async def export_analytics_pdf(
    current_user: dict = Depends(get_current_user)
):
    """Export analytics report as PDF."""
    org_id = current_user["organizationId"]
    
    # Gather stats
    total_contracts = await db.contracts.count_documents({"organizationId": org_id})
    active_contracts = await db.contracts.count_documents({"organizationId": org_id, "status": "active"})
    
    from datetime import datetime, timezone, timedelta
    thirty_days_later = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    today = datetime.now(timezone.utc).isoformat()
    
    expiring_soon = await db.contracts.count_documents({
        "organizationId": org_id,
        "expiryDate": {"$gte": today, "$lte": thirty_days_later}
    })
    
    high_risk = await db.contracts.count_documents({"organizationId": org_id, "riskLevel": "high"})
    team_members = await db.users.count_documents({"organizationId": org_id})
    
    by_status = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    by_risk = await db.contracts.aggregate([
        {"$match": {"organizationId": org_id, "riskLevel": {"$ne": None}}},
        {"$group": {"_id": "$riskLevel", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    stats = {
        "overview": {
            "totalContracts": total_contracts,
            "activeContracts": active_contracts,
            "expiringSoon": expiring_soon,
            "highRisk": high_risk,
            "teamMembers": team_members
        },
        "byStatus": {item["_id"]: item["count"] for item in by_status if item["_id"]},
        "byRisk": {item["_id"]: item["count"] for item in by_risk if item["_id"]}
    }
    
    contracts = await db.contracts.find(
        {"organizationId": org_id},
        {"_id": 0, "originalText": 0}
    ).to_list(1000)
    
    pdf_bytes = generate_analytics_pdf(stats, contracts)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=lexisense_analytics_report.pdf"
        }
    )
