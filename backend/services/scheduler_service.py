import asyncio
import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from services.email_service import send_expiration_alert

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
db = None

def init_scheduler(database):
    """Initialize the scheduler with database connection."""
    global db
    db = database
    
    # Schedule daily alert check at 9:00 AM
    scheduler.add_job(
        check_and_send_daily_alerts,
        CronTrigger(hour=9, minute=0),
        id='daily_alert_check',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - daily alert check scheduled for 9:00 AM")


async def check_and_send_daily_alerts():
    """Check for expiring contracts and send alerts."""
    if not db:
        logger.error("Database not initialized for scheduler")
        return
    
    logger.info("Running scheduled alert check...")
    
    try:
        # Get all organizations
        organizations = await db.organizations.find({}, {"_id": 0, "id": 1}).to_list(1000)
        
        total_alerts_sent = 0
        
        for org in organizations:
            org_id = org["id"]
            
            # Get alert settings for this organization
            settings = await db.alert_settings.find_one(
                {"organizationId": org_id},
                {"_id": 0}
            )
            
            if not settings:
                settings = {"alertDays": [30, 14, 7, 1], "emailEnabled": True}
            
            if not settings.get("emailEnabled", True):
                continue
            
            today = datetime.now(timezone.utc)
            
            # Get all admin users in the organization
            admins = await db.users.find(
                {"organizationId": org_id, "role": "admin"},
                {"_id": 0, "id": 1, "email": 1}
            ).to_list(100)
            
            if not admins:
                continue
            
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
                    # Check if alert was already sent
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
                        total_alerts_sent += 1
                    
                    # Record alert as sent
                    from models.alerts import ExpirationAlert
                    alert = ExpirationAlert(
                        contractId=contract["id"],
                        userId="system",
                        daysBeforeExpiry=alert_day,
                        emailSent=True,
                        emailSentAt=datetime.now(timezone.utc).isoformat()
                    )
                    await db.expiration_alerts.insert_one(alert.model_dump())
        
        logger.info(f"Scheduled alert check completed. {total_alerts_sent} alerts sent.")
        
    except Exception as e:
        logger.error(f"Scheduled alert check failed: {e}")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shutdown")
