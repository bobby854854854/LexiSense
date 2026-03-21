import os
import asyncio
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "LexiSense <onboarding@resend.dev>")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def get_email_template(template_type: str, data: dict) -> tuple[str, str]:
    """Generate email subject and HTML content based on template type."""
    
    if template_type == "invitation":
        subject = f"You've been invited to join {data.get('organization_name', 'a team')} on LexiSense"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f1318;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f1318; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f26; border-radius: 12px; overflow: hidden;">
                            <tr>
                                <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #2a3038;">
                                    <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: 700;">⚖️ LexiSense</h1>
                                    <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">Contract Lifecycle Management</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px; color: #f3f4f6; font-size: 22px; font-weight: 600;">You're Invited!</h2>
                                    <p style="margin: 0 0 25px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                        <strong style="color: #f3f4f6;">{data.get('inviter_name', 'A team member')}</strong> has invited you to join 
                                        <strong style="color: #2563eb;">{data.get('organization_name', 'their organization')}</strong> on LexiSense.
                                    </p>
                                    <p style="margin: 0 0 30px; color: #9ca3af; font-size: 14px;">
                                        You've been assigned the role: <span style="color: #a78bfa; font-weight: 600;">{data.get('role', 'User').upper()}</span>
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <a href="{APP_URL}/accept-invite?token={data.get('token', '')}" 
                                                   style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                    Accept Invitation
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 30px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                                        This invitation expires in 7 days.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 25px 40px; background-color: #141920; text-align: center;">
                                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                        © 2026 LexiSense. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
    elif template_type == "expiration_alert":
        days_remaining = data.get('days_remaining', 0)
        urgency_color = "#ef4444" if days_remaining <= 7 else "#f59e0b" if days_remaining <= 14 else "#22c55e"
        subject = f"⚠️ Contract Expiring Soon: {data.get('contract_title', 'Contract')}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f1318;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f1318; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1f26; border-radius: 12px; overflow: hidden;">
                            <tr>
                                <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #2a3038;">
                                    <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: 700;">⚖️ LexiSense</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <div style="text-align: center; margin-bottom: 30px;">
                                        <span style="display: inline-block; padding: 8px 20px; background-color: {urgency_color}20; color: {urgency_color}; font-size: 14px; font-weight: 600; border-radius: 20px; border: 1px solid {urgency_color}40;">
                                            ⏰ {days_remaining} days remaining
                                        </span>
                                    </div>
                                    <h2 style="margin: 0 0 20px; color: #f3f4f6; font-size: 20px; font-weight: 600;">Contract Expiration Alert</h2>
                                    <table width="100%" style="background-color: #242a33; border-radius: 8px; margin-bottom: 25px;" cellpadding="20" cellspacing="0">
                                        <tr>
                                            <td>
                                                <p style="margin: 0 0 10px; color: #9ca3af; font-size: 13px;">CONTRACT</p>
                                                <p style="margin: 0 0 15px; color: #f3f4f6; font-size: 18px; font-weight: 600;">{data.get('contract_title', 'Untitled Contract')}</p>
                                                <p style="margin: 0 0 5px; color: #9ca3af; font-size: 13px;">COUNTERPARTY</p>
                                                <p style="margin: 0 0 15px; color: #d1d5db; font-size: 15px;">{data.get('counterparty', 'Not specified')}</p>
                                                <p style="margin: 0 0 5px; color: #9ca3af; font-size: 13px;">EXPIRY DATE</p>
                                                <p style="margin: 0; color: {urgency_color}; font-size: 15px; font-weight: 600;">{data.get('expiry_date', 'Unknown')}</p>
                                            </td>
                                        </tr>
                                    </table>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <a href="{APP_URL}/contracts/{data.get('contract_id', '')}" 
                                                   style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                                    Review Contract
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 25px 40px; background-color: #141920; text-align: center;">
                                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                        You received this alert because you have contracts expiring soon.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
    else:
        subject = "LexiSense Notification"
        html = f"<p>{data.get('message', 'You have a notification from LexiSense.')}</p>"
    
    return subject, html


async def send_email(
    to_email: str,
    template_type: str,
    data: dict
) -> Optional[dict]:
    """Send an email using Resend API."""
    if not RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not configured. Email to {to_email} logged but not sent.")
        logger.info(f"Would send {template_type} email to {to_email} with data: {data}")
        return {"status": "logged", "message": "Email logged (API key not configured)"}
    
    try:
        subject, html_content = get_email_template(template_type, data)
        
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Email sent successfully to {to_email}: {email.get('id')}")
        return {
            "status": "success",
            "message": f"Email sent to {to_email}",
            "email_id": email.get("id")
        }
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


async def send_invitation_email(
    to_email: str,
    inviter_name: str,
    organization_name: str,
    role: str,
    token: str
) -> Optional[dict]:
    """Send a team invitation email."""
    return await send_email(
        to_email=to_email,
        template_type="invitation",
        data={
            "inviter_name": inviter_name,
            "organization_name": organization_name,
            "role": role,
            "token": token
        }
    )


async def send_expiration_alert(
    to_email: str,
    contract_id: str,
    contract_title: str,
    counterparty: str,
    expiry_date: str,
    days_remaining: int
) -> Optional[dict]:
    """Send a contract expiration alert email."""
    return await send_email(
        to_email=to_email,
        template_type="expiration_alert",
        data={
            "contract_id": contract_id,
            "contract_title": contract_title,
            "counterparty": counterparty,
            "expiry_date": expiry_date,
            "days_remaining": days_remaining
        }
    )
