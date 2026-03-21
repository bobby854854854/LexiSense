from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import logging

from models.alerts import ExpirationAlert, AlertSettings
from utils.auth import get_current_user
from services.email_service import send_expiration_alert

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/settings")
async def get_alert_settings(current_user: dict = Depends(get_current_user)):
    """Get alert settings for the organization."""
    settings = await db.alert_settings.find_one(
        {"organizationId": current_user["organizationId"]},
        {"_id": 0}
    )
    
    if not settings:
        # Return default settings
        return {
            "alertDays": [30, 14, 7, 1],
            "emailEnabled": True
        }
    
    return settings


@router.put("/settings")
async def update_alert_settings(
    alertDays: List[int] = [30, 14, 7, 1],
    emailEnabled: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Update alert settings for the organization."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update alert settings"
        )
    
    settings = AlertSettings(
        organizationId=current_user["organizationId"],
        alertDays=sorted(alertDays, reverse=True),
        emailEnabled=emailEnabled
    )
    
    await db.alert_settings.update_one(
        {"organizationId": current_user["organizationId"]},
        {"$set": settings.model_dump()},
        upsert=True
    )
    
    return {"message": "Alert settings updated", "settings": settings.model_dump()}


@router.get("/expiring")
async def get_expiring_contracts(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get contracts expiring within specified days."""
    org_id = current_user["organizationId"]
    today = datetime.now(timezone.utc)
    future_date = (today + timedelta(days=days)).isoformat()
    today_str = today.isoformat()
    
    expiring = await db.contracts.find(
        {
            "organizationId": org_id,
            "expiryDate": {"$ne": None, "$gte": today_str[:10], "$lte": future_date[:10]},
            "status": {"$ne": "expired"}
        },
        {"_id": 0, "originalText": 0}
    ).sort("expiryDate", 1).to_list(100)
    
    # Calculate days remaining for each contract
    for contract in expiring:
        if contract.get("expiryDate"):
            try:
                expiry = datetime.fromisoformat(contract["expiryDate"].replace("Z", "+00:00"))
                if expiry.tzinfo is None:
                    expiry = expiry.replace(tzinfo=timezone.utc)
                days_remaining = (expiry - today).days
                contract["daysRemaining"] = max(0, days_remaining)
            except:
                contract["daysRemaining"] = None
    
    return {"contracts": expiring, "total": len(expiring)}


@router.post("/check-and-send")
async def check_and_send_alerts(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Manually trigger alert check and send emails for expiring contracts."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can trigger alert checks"
        )
    
    org_id = current_user["organizationId"]
    
    # Get alert settings
    settings = await db.alert_settings.find_one(
        {"organizationId": org_id},
        {"_id": 0}
    )
    
    if not settings:
        settings = {"alertDays": [30, 14, 7, 1], "emailEnabled": True}
    
    if not settings.get("emailEnabled", True):
        return {"message": "Email alerts are disabled", "sent": 0}
    
    today = datetime.now(timezone.utc)
    alerts_sent = 0
    
    # Get all admin users in the organization to send alerts to
    admins = await db.users.find(
        {"organizationId": org_id, "role": "admin"},
        {"_id": 0, "id": 1, "email": 1}
    ).to_list(100)
    
    for alert_day in settings.get("alertDays", [30, 14, 7, 1]):
        target_date = (today + timedelta(days=alert_day)).strftime("%Y-%m-%d")
        
        # Find contracts expiring on this specific day
        expiring_contracts = await db.contracts.find(
            {
                "organizationId": org_id,
                "expiryDate": target_date,
                "status": {"$ne": "expired"}
            },
            {"_id": 0}
        ).to_list(100)
        
        for contract in expiring_contracts:
            # Check if alert was already sent for this contract and day
            existing_alert = await db.expiration_alerts.find_one({
                "contractId": contract["id"],
                "daysBeforeExpiry": alert_day,
                "emailSent": True
            })
            
            if existing_alert:
                continue
            
            # Send alert to all admins
            for admin in admins:
                await send_expiration_alert(
                    to_email=admin["email"],
                    contract_id=contract["id"],
                    contract_title=contract.get("title", "Untitled"),
                    counterparty=contract.get("counterparty", "Not specified"),
                    expiry_date=contract.get("expiryDate", "Unknown"),
                    days_remaining=alert_day
                )
                alerts_sent += 1
            
            # Record alert as sent
            alert = ExpirationAlert(
                contractId=contract["id"],
                userId=current_user["sub"],
                daysBeforeExpiry=alert_day,
                emailSent=True,
                emailSentAt=datetime.now(timezone.utc).isoformat()
            )
            await db.expiration_alerts.insert_one(alert.model_dump())
    
    return {"message": f"Alert check completed", "alertsSent": alerts_sent}


@router.get("/history")
async def get_alert_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get history of sent alerts."""
    # Get contract IDs for the organization
    contracts = await db.contracts.find(
        {"organizationId": current_user["organizationId"]},
        {"_id": 0, "id": 1, "title": 1}
    ).to_list(1000)
    
    contract_ids = [c["id"] for c in contracts]
    contract_titles = {c["id"]: c["title"] for c in contracts}
    
    alerts = await db.expiration_alerts.find(
        {"contractId": {"$in": contract_ids}},
        {"_id": 0}
    ).sort("createdAt", -1).limit(limit).to_list(limit)
    
    # Add contract titles
    for alert in alerts:
        alert["contractTitle"] = contract_titles.get(alert["contractId"], "Unknown")
    
    return {"alerts": alerts}
