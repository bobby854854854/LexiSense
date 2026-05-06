from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import pyotp
import qrcode
import io
import base64
import logging

from utils.auth import get_current_user, verify_password, create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/2fa", tags=["Two-Factor Auth"])

db = None

def init_db(database):
    global db
    db = database


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qrCodeUrl: str
    qrCodeImage: str


class TwoFactorVerifyRequest(BaseModel):
    code: str


class TwoFactorLoginRequest(BaseModel):
    email: str
    password: str
    code: str


@router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    """Generate a new 2FA secret and QR code for the user."""
    user_doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if user_doc.get("twoFactorEnabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user_doc["email"],
        issuer_name="LexiSense",
    )

    # Generate QR code as base64
    qr = qrcode.make(provisioning_uri)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Store secret temporarily (not enabled until verified)
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"twoFactorSecret": secret}},
    )

    return TwoFactorSetupResponse(
        secret=secret,
        qrCodeUrl=provisioning_uri,
        qrCodeImage=f"data:image/png;base64,{qr_base64}",
    )


@router.post("/verify")
async def verify_and_enable_2fa(
    body: TwoFactorVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Verify a 2FA code and enable 2FA for the user."""
    user_doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    secret = user_doc.get("twoFactorSecret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    totp = pyotp.TOTP(secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"twoFactorEnabled": True}},
    )

    return {"message": "Two-factor authentication enabled successfully"}


@router.post("/disable")
async def disable_2fa(
    body: TwoFactorVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Disable 2FA for the user (requires current code)."""
    user_doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if not user_doc.get("twoFactorEnabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    secret = user_doc.get("twoFactorSecret")
    totp = pyotp.TOTP(secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"twoFactorEnabled": False}, "$unset": {"twoFactorSecret": ""}},
    )

    return {"message": "Two-factor authentication disabled"}


@router.get("/status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """Check if 2FA is enabled for the current user."""
    user_doc = await db.users.find_one(
        {"id": current_user["sub"]},
        {"_id": 0, "twoFactorEnabled": 1},
    )
    return {"enabled": user_doc.get("twoFactorEnabled", False) if user_doc else False}


@router.post("/login")
async def login_with_2fa(body: TwoFactorLoginRequest):
    """Login with 2FA code (used when user has 2FA enabled)."""
    user_doc = await db.users.find_one({"email": body.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(body.password, user_doc["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user_doc.get("isActive", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")

    secret = user_doc.get("twoFactorSecret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA not configured")

    totp = pyotp.TOTP(secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"lastLogin": datetime.now(timezone.utc).isoformat()}},
    )

    access_token = create_access_token(
        data={
            "sub": user_doc["id"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "organizationId": user_doc.get("organizationId"),
        }
    )

    from models.user import UserResponse, TokenResponse
    user_response = UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        firstName=user_doc.get("firstName"),
        lastName=user_doc.get("lastName"),
        role=user_doc["role"],
        organizationId=user_doc.get("organizationId"),
        isActive=user_doc.get("isActive", True),
        lastLogin=datetime.now(timezone.utc).isoformat(),
        createdAt=user_doc["createdAt"],
    )

    return TokenResponse(access_token=access_token, user=user_response)
