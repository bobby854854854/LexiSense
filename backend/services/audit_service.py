import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

db = None

def init_db(database):
    global db
    db = database


async def log_action(
    organization_id: str,
    user_id: str,
    user_email: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    resource_title: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """Log an audit action."""
    from models.audit import AuditLog
    entry = AuditLog(
        organizationId=organization_id,
        userId=user_id,
        userEmail=user_email,
        action=action,
        resourceType=resource_type,
        resourceId=resource_id,
        resourceTitle=resource_title,
        details=details,
    )
    try:
        await db.audit_logs.insert_one(entry.model_dump())
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")


async def send_notification(
    organization_id: str,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
):
    """Create an in-app notification for a user."""
    from models.notification import Notification
    notif = Notification(
        organizationId=organization_id,
        userId=user_id,
        type=notification_type,
        title=title,
        message=message,
        resourceType=resource_type,
        resourceId=resource_id,
    )
    try:
        await db.notifications.insert_one(notif.model_dump())
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
