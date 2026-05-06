from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from typing import Optional
from datetime import datetime, timezone, timedelta
import csv
import io
import logging

from utils.auth import get_current_user
from services.pdf_export_service import generate_contract_pdf, generate_analytics_pdf

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

db = None

def init_db(database):
    global db
    db = database


@router.get("/contracts/csv")
async def export_contracts_csv(
    status_filter: Optional[str] = None,
    contract_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Export filtered contracts as CSV."""
    query = {"organizationId": current_user["organizationId"]}
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    if contract_type and contract_type != "all":
        query["contractType"] = contract_type
    if risk_level and risk_level != "all":
        query["riskLevel"] = risk_level
    if date_from:
        query.setdefault("createdAt", {})["$gte"] = date_from
    if date_to:
        query.setdefault("createdAt", {})["$lte"] = date_to
    if tags:
        query["tags"] = {"$in": [t.strip() for t in tags.split(",")]}

    contracts = await db.contracts.find(
        query, {"_id": 0, "originalText": 0, "aiAnalysis": 0, "workflowHistory": 0}
    ).sort("createdAt", -1).to_list(5000)

    # Batch fetch uploader emails
    uploader_ids = list(set(c.get("uploadedBy") for c in contracts if c.get("uploadedBy")))
    uploaders = await db.users.find({"id": {"$in": uploader_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(len(uploader_ids))
    uploader_map = {u["id"]: u["email"] for u in uploaders}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Title", "Counterparty", "Type", "Category", "Status", "Risk Level",
        "Value", "Effective Date", "Expiry Date", "Tags", "Uploaded By", "Created At",
    ])

    for c in contracts:
        writer.writerow([
            c.get("title", ""),
            c.get("counterparty", ""),
            c.get("contractType", ""),
            c.get("category", ""),
            c.get("status", ""),
            c.get("riskLevel", ""),
            c.get("value", ""),
            c.get("effectiveDate", ""),
            c.get("expiryDate", ""),
            ", ".join(c.get("tags", [])),
            uploader_map.get(c.get("uploadedBy"), ""),
            c.get("createdAt", ""),
        ])

    content = output.getvalue()
    output.close()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lexisense_contracts_report.csv"},
    )


@router.get("/summary")
async def get_report_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get a comprehensive summary report with breakdowns."""
    org_id = current_user["organizationId"]
    query = {"organizationId": org_id}
    if date_from:
        query.setdefault("createdAt", {})["$gte"] = date_from
    if date_to:
        query.setdefault("createdAt", {})["$lte"] = date_to

    total = await db.contracts.count_documents(query)

    by_status = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]).to_list(20)

    by_type = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {"_id": "$contractType", "count": {"$sum": 1}}},
    ]).to_list(50)

    by_risk = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {"_id": "$riskLevel", "count": {"$sum": 1}}},
    ]).to_list(10)

    by_category = await db.contracts.aggregate([
        {"$match": {**query, "category": {"$ne": None}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
    ]).to_list(50)

    by_tag = await db.contracts.aggregate([
        {"$match": query},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]).to_list(20)

    # Monthly trend for the period
    monthly = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {
            "_id": {"$substr": ["$createdAt", 0, 7]},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]).to_list(24)

    # Expiring soon counts
    now = datetime.now(timezone.utc).isoformat()
    d7 = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    d30 = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    d90 = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()

    exp7 = await db.contracts.count_documents({**query, "expiryDate": {"$gte": now, "$lte": d7}})
    exp30 = await db.contracts.count_documents({**query, "expiryDate": {"$gte": now, "$lte": d30}})
    exp90 = await db.contracts.count_documents({**query, "expiryDate": {"$gte": now, "$lte": d90}})

    return {
        "total": total,
        "byStatus": {s["_id"]: s["count"] for s in by_status if s["_id"]},
        "byType": {t["_id"]: t["count"] for t in by_type if t["_id"]},
        "byRisk": {r["_id"]: r["count"] for r in by_risk if r["_id"]},
        "byCategory": {c["_id"]: c["count"] for c in by_category if c["_id"]},
        "topTags": [{"tag": t["_id"], "count": t["count"]} for t in by_tag],
        "monthlyTrend": [{"month": m["_id"], "count": m["count"]} for m in monthly],
        "expiring": {"next7Days": exp7, "next30Days": exp30, "next90Days": exp90},
    }


@router.get("/summary/pdf")
async def export_summary_pdf(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Export the summary report as PDF."""
    org_id = current_user["organizationId"]
    query = {"organizationId": org_id}
    if date_from:
        query.setdefault("createdAt", {})["$gte"] = date_from
    if date_to:
        query.setdefault("createdAt", {})["$lte"] = date_to

    total = await db.contracts.count_documents(query)
    by_status = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]).to_list(20)
    by_risk = await db.contracts.aggregate([
        {"$match": query},
        {"$group": {"_id": "$riskLevel", "count": {"$sum": 1}}},
    ]).to_list(10)

    contracts = await db.contracts.find(query, {"_id": 0, "originalText": 0}).to_list(5000)

    stats = {
        "overview": {
            "totalContracts": total,
            "activeContracts": sum(1 for c in contracts if c.get("status") == "active"),
            "expiringSoon": 0,
            "highRisk": sum(1 for c in contracts if c.get("riskLevel") == "high"),
            "teamMembers": await db.users.count_documents({"organizationId": org_id}),
        },
        "byStatus": {s["_id"]: s["count"] for s in by_status if s["_id"]},
        "byRisk": {r["_id"]: r["count"] for r in by_risk if r["_id"]},
    }
    pdf_bytes = generate_analytics_pdf(stats, contracts)
    period = ""
    if date_from or date_to:
        period = f"_{date_from or 'all'}_to_{date_to or 'now'}"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=lexisense_report{period}.pdf"},
    )
