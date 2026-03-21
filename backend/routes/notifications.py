from fastapi import APIRouter, Depends
from typing import List
import logging

from models.notification import NotificationResponse
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])

db = None

def init_db(database):
    global db
    db = database


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """List notifications for the current user."""
    notifs = (
        await db.notifications.find(
            {"userId": current_user["sub"]},
            {"_id": 0},
        )
        .sort("createdAt", -1)
        .limit(limit)
        .to_list(limit)
    )

    return [
        NotificationResponse(
            id=n["id"],
            type=n["type"],
            title=n["title"],
            message=n["message"],
            resourceType=n.get("resourceType"),
            resourceId=n.get("resourceId"),
            isRead=n.get("isRead", False),
            createdAt=n["createdAt"],
        )
        for n in notifs
    ]


@router.get("/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications."""
    count = await db.notifications.count_documents(
        {"userId": current_user["sub"], "isRead": False}
    )
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a notification as read."""
    await db.notifications.update_one(
        {"id": notification_id, "userId": current_user["sub"]},
        {"$set": {"isRead": True}},
    )
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    await db.notifications.update_many(
        {"userId": current_user["sub"], "isRead": False},
        {"$set": {"isRead": True}},
    )
    return {"message": "All marked as read"}
