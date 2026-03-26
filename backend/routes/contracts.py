from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
import logging
import uuid

from models.contract import Contract, ContractCreate, ContractResponse, ChatMessage, ChatResponse
from models.contract_version import ContractVersion, ContractVersionResponse
from utils.auth import get_current_user
from services.ai_service import analyze_contract, get_chat_response
from services.storage_service import upload_file_to_s3, delete_file_from_s3
from services.pdf_service import extract_text_from_file
from services.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contracts", tags=["Contracts"])

db = None
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["application/pdf", "text/plain"]

def init_db(database):
    global db
    db = database


@router.get("", response_model=List[ContractResponse])
async def list_contracts(
    status_filter: Optional[str] = None,
    contract_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    counterparty: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    expiring_within: Optional[int] = None,
    tags: Optional[str] = None,
    sort_by: Optional[str] = "createdAt",
    sort_order: Optional[str] = "desc",
    current_user: dict = Depends(get_current_user)
):
    """List all contracts with advanced filtering options."""
    query = {"organizationId": current_user["organizationId"]}
    
    # Basic filters
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    if contract_type and contract_type != "all":
        query["contractType"] = contract_type
    if risk_level and risk_level != "all":
        query["riskLevel"] = risk_level
    if counterparty:
        query["counterparty"] = {"$regex": counterparty, "$options": "i"}
    
    # Text search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"counterparty": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Date range filters
    if date_from:
        query["createdAt"] = {"$gte": date_from}
    if date_to:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = date_to
        else:
            query["createdAt"] = {"$lte": date_to}
    
    # Expiring within N days
    if expiring_within:
        from datetime import timedelta
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        future = (datetime.now(timezone.utc) + timedelta(days=expiring_within)).strftime("%Y-%m-%d")
        query["expiryDate"] = {"$gte": today, "$lte": future}
        query["status"] = {"$ne": "expired"}
    
    # Tags filter
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    # Sorting
    sort_direction = -1 if sort_order == "desc" else 1
    sort_field = sort_by if sort_by in ["createdAt", "title", "expiryDate", "riskLevel"] else "createdAt"
    
    contracts = await db.contracts.find(query, {"_id": 0, "originalText": 0}).sort(sort_field, sort_direction).to_list(1000)
    
    # Batch fetch uploader emails to avoid N+1 queries
    uploader_ids = list(set(c.get("uploadedBy") for c in contracts if c.get("uploadedBy")))
    uploaders = await db.users.find({"id": {"$in": uploader_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(len(uploader_ids))
    uploader_map = {u["id"]: u["email"] for u in uploaders}
    
    result = []
    for c in contracts:
        result.append(ContractResponse(
            id=c["id"],
            organizationId=c["organizationId"],
            uploadedBy=c["uploadedBy"],
            title=c["title"],
            counterparty=c.get("counterparty"),
            contractType=c.get("contractType", "General"),
            status=c.get("status", "draft"),
            value=c.get("value"),
            effectiveDate=c.get("effectiveDate"),
            expiryDate=c.get("expiryDate"),
            riskLevel=c.get("riskLevel"),
            aiAnalysis=c.get("aiAnalysis"),
            fileName=c.get("fileName"),
            fileSize=c.get("fileSize"),
            tags=c.get("tags", []),
            createdAt=c["createdAt"],
            updatedAt=c["updatedAt"],
            uploaderEmail=uploader_map.get(c.get("uploadedBy"))
        ))
    
    return result


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single contract by ID."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    uploader = await db.users.find_one({"id": contract.get("uploadedBy")}, {"_id": 0, "email": 1})
    
    return ContractResponse(
        id=contract["id"],
        organizationId=contract["organizationId"],
        uploadedBy=contract["uploadedBy"],
        title=contract["title"],
        counterparty=contract.get("counterparty"),
        contractType=contract.get("contractType", "General"),
        status=contract.get("status", "draft"),
        value=contract.get("value"),
        effectiveDate=contract.get("effectiveDate"),
        expiryDate=contract.get("expiryDate"),
        riskLevel=contract.get("riskLevel"),
        aiAnalysis=contract.get("aiAnalysis"),
        fileName=contract.get("fileName"),
        fileSize=contract.get("fileSize"),
        tags=contract.get("tags", []),
        createdAt=contract["createdAt"],
        updatedAt=contract["updatedAt"],
        uploaderEmail=uploader["email"] if uploader else None
    )


@router.post("", response_model=ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    title: str = Form(...),
    counterparty: Optional[str] = Form(None),
    contractType: str = Form("General"),
    current_user: dict = Depends(get_current_user)
):
    """Upload and analyze a new contract."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and TXT files are allowed."
        )
    
    file_content = await file.read()
    
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed (10MB)"
        )
    
    extracted_text = await extract_text_from_file(file_content, file.content_type)
    
    if not extracted_text or len(extracted_text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from file. The file may be empty or corrupted."
        )
    
    storage_key = await upload_file_to_s3(
        file_content,
        file.filename,
        current_user["organizationId"],
        file.content_type
    )
    
    ai_analysis = None
    risk_level = None
    effective_date = None
    expiry_date = None
    contract_value = None
    
    try:
        ai_analysis = await analyze_contract(extracted_text)
        if ai_analysis:
            risk_level = ai_analysis.get("riskLevel")
            dates = ai_analysis.get("dates", {})
            effective_date = dates.get("effectiveDate")
            expiry_date = dates.get("expiryDate")
            contract_value = ai_analysis.get("value")
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
    
    contract = Contract(
        organizationId=current_user["organizationId"],
        uploadedBy=current_user["sub"],
        title=title,
        counterparty=counterparty,
        contractType=contractType,
        status="draft",
        value=contract_value,
        effectiveDate=effective_date,
        expiryDate=expiry_date,
        riskLevel=risk_level,
        originalText=extracted_text,
        aiAnalysis=ai_analysis,
        storageKey=storage_key,
        fileName=file.filename,
        fileSize=len(file_content),
        mimeType=file.content_type
    )
    
    contract_doc = contract.model_dump()
    await db.contracts.insert_one(contract_doc)
    
    await log_action(
        organization_id=current_user["organizationId"],
        user_id=current_user["sub"],
        user_email=current_user.get("email"),
        action="contract_uploaded",
        resource_type="contract",
        resource_id=contract.id,
        resource_title=title,
    )
    
    uploader = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "email": 1})
    
    return ContractResponse(
        id=contract.id,
        organizationId=contract.organizationId,
        uploadedBy=contract.uploadedBy,
        title=contract.title,
        counterparty=contract.counterparty,
        contractType=contract.contractType,
        status=contract.status,
        value=contract.value,
        effectiveDate=contract.effectiveDate,
        expiryDate=contract.expiryDate,
        riskLevel=contract.riskLevel,
        aiAnalysis=contract.aiAnalysis,
        fileName=contract.fileName,
        fileSize=contract.fileSize,
        tags=contract.tags,
        createdAt=contract.createdAt,
        updatedAt=contract.updatedAt,
        uploaderEmail=uploader["email"] if uploader else None
    )


@router.post("/bulk")
async def bulk_upload_contracts(
    files: List[UploadFile] = File(...),
    contractType: str = Form("General"),
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload multiple contracts at once."""
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files allowed per bulk upload"
        )
    
    results = {
        "successful": [],
        "failed": []
    }
    
    for file in files:
        try:
            if file.content_type not in ALLOWED_MIME_TYPES:
                results["failed"].append({
                    "filename": file.filename,
                    "error": "Invalid file type. Only PDF and TXT files are allowed."
                })
                continue
            
            file_content = await file.read()
            
            if len(file_content) > MAX_FILE_SIZE:
                results["failed"].append({
                    "filename": file.filename,
                    "error": "File size exceeds maximum allowed (10MB)"
                })
                continue
            
            extracted_text = await extract_text_from_file(file_content, file.content_type)
            
            if not extracted_text or len(extracted_text.strip()) == 0:
                results["failed"].append({
                    "filename": file.filename,
                    "error": "Could not extract text from file"
                })
                continue
            
            storage_key = await upload_file_to_s3(
                file_content,
                file.filename,
                current_user["organizationId"],
                file.content_type
            )
            
            # Generate title from filename
            title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
            
            # Analyze contract
            ai_analysis = None
            risk_level = None
            effective_date = None
            expiry_date = None
            contract_value = None
            
            try:
                ai_analysis = await analyze_contract(extracted_text)
                if ai_analysis:
                    risk_level = ai_analysis.get("riskLevel")
                    dates = ai_analysis.get("dates", {})
                    effective_date = dates.get("effectiveDate")
                    expiry_date = dates.get("expiryDate")
                    contract_value = ai_analysis.get("value")
            except Exception as e:
                logger.error(f"AI analysis failed for {file.filename}: {e}")
            
            contract = Contract(
                organizationId=current_user["organizationId"],
                uploadedBy=current_user["sub"],
                title=title,
                contractType=contractType,
                status="draft",
                value=contract_value,
                effectiveDate=effective_date,
                expiryDate=expiry_date,
                riskLevel=risk_level,
                originalText=extracted_text,
                aiAnalysis=ai_analysis,
                storageKey=storage_key,
                fileName=file.filename,
                fileSize=len(file_content),
                mimeType=file.content_type
            )
            
            await db.contracts.insert_one(contract.model_dump())
            
            results["successful"].append({
                "id": contract.id,
                "filename": file.filename,
                "title": title,
                "riskLevel": risk_level
            })
            
        except Exception as e:
            logger.error(f"Bulk upload failed for {file.filename}: {e}")
            results["failed"].append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "message": f"Processed {len(files)} files",
        "successful": len(results["successful"]),
        "failed": len(results["failed"]),
        "results": results
    }


@router.post("/{contract_id}/chat", response_model=ChatResponse)
async def chat_with_contract(
    contract_id: str,
    message: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Ask a question about a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    if not contract.get("originalText"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract text not available for analysis"
        )
    
    session_id = f"chat-{contract_id}-{current_user['sub']}"
    
    try:
        answer = await get_chat_response(
            contract["originalText"],
            message.question,
            session_id
        )
        
        chat_doc = {
            "id": str(uuid.uuid4()),
            "contractId": contract_id,
            "userId": current_user["sub"],
            "question": message.question,
            "answer": answer,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_history.insert_one(chat_doc)
        
        return ChatResponse(answer=answer, contractId=contract_id)
        
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process question"
        )


@router.patch("/{contract_id}")
async def update_contract(
    contract_id: str,
    title: Optional[str] = None,
    counterparty: Optional[str] = None,
    contractType: Optional[str] = None,
    contract_status: Optional[str] = None,
    tags: Optional[List[str]] = None,
    changeReason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update a contract's metadata and create a version history entry."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]},
        {"_id": 0}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Get current version number
    latest_version = await db.contract_versions.find_one(
        {"contractId": contract_id},
        {"_id": 0, "version": 1},
        sort=[("version", -1)]
    )
    new_version = (latest_version["version"] + 1) if latest_version else 1
    
    # Create version snapshot before update
    version = ContractVersion(
        contractId=contract_id,
        version=new_version,
        title=contract.get("title"),
        counterparty=contract.get("counterparty"),
        contractType=contract.get("contractType"),
        status=contract.get("status"),
        value=contract.get("value"),
        effectiveDate=contract.get("effectiveDate"),
        expiryDate=contract.get("expiryDate"),
        riskLevel=contract.get("riskLevel"),
        originalText=contract.get("originalText"),
        aiAnalysis=contract.get("aiAnalysis"),
        changedBy=current_user["sub"],
        changeReason=changeReason
    )
    await db.contract_versions.insert_one(version.model_dump())
    
    # Apply updates
    update_data = {"updatedAt": datetime.now(timezone.utc).isoformat()}
    if title is not None:
        update_data["title"] = title
    if counterparty is not None:
        update_data["counterparty"] = counterparty
    if contractType is not None:
        update_data["contractType"] = contractType
    if contract_status is not None:
        update_data["status"] = contract_status
    if tags is not None:
        update_data["tags"] = tags
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": update_data}
    )
    
    return {"message": "Contract updated successfully", "version": new_version}


@router.get("/{contract_id}/versions", response_model=List[ContractVersionResponse])
async def get_contract_versions(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get version history for a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    versions = await db.contract_versions.find(
        {"contractId": contract_id},
        {"_id": 0}
    ).sort("version", -1).to_list(100)
    
    result = []
    changer_ids = list(set(v["changedBy"] for v in versions if v.get("changedBy")))
    changers = await db.users.find({"id": {"$in": changer_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(len(changer_ids))
    changer_map = {u["id"]: u["email"] for u in changers}
    for v in versions:
        result.append(ContractVersionResponse(
            id=v["id"],
            contractId=v["contractId"],
            version=v["version"],
            title=v["title"],
            status=v["status"],
            changedBy=v["changedBy"],
            changedByEmail=changer_map.get(v["changedBy"]),
            changeReason=v.get("changeReason"),
            createdAt=v["createdAt"]
        ))
    
    return result


@router.get("/{contract_id}/versions/{version_num}")
async def get_contract_version(
    contract_id: str,
    version_num: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific version of a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    version = await db.contract_versions.find_one(
        {"contractId": contract_id, "version": version_num},
        {"_id": 0}
    )
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    user = await db.users.find_one({"id": version["changedBy"]}, {"_id": 0, "email": 1})
    version["changedByEmail"] = user["email"] if user else None
    
    return version


@router.post("/{contract_id}/restore/{version_num}")
async def restore_contract_version(
    contract_id: str,
    version_num: int,
    current_user: dict = Depends(get_current_user)
):
    """Restore a contract to a previous version."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    version = await db.contract_versions.find_one(
        {"contractId": contract_id, "version": version_num},
        {"_id": 0}
    )
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    # Create a new version entry for the current state before restoring
    latest_version = await db.contract_versions.find_one(
        {"contractId": contract_id},
        {"_id": 0, "version": 1},
        sort=[("version", -1)]
    )
    new_version = (latest_version["version"] + 1) if latest_version else 1
    
    current_version = ContractVersion(
        contractId=contract_id,
        version=new_version,
        title=contract.get("title"),
        counterparty=contract.get("counterparty"),
        contractType=contract.get("contractType"),
        status=contract.get("status"),
        value=contract.get("value"),
        effectiveDate=contract.get("effectiveDate"),
        expiryDate=contract.get("expiryDate"),
        riskLevel=contract.get("riskLevel"),
        originalText=contract.get("originalText"),
        aiAnalysis=contract.get("aiAnalysis"),
        changedBy=current_user["sub"],
        changeReason=f"Before restoring to version {version_num}"
    )
    await db.contract_versions.insert_one(current_version.model_dump())
    
    # Restore the contract to the selected version
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "title": version["title"],
            "counterparty": version.get("counterparty"),
            "contractType": version["contractType"],
            "status": version["status"],
            "value": version.get("value"),
            "effectiveDate": version.get("effectiveDate"),
            "expiryDate": version.get("expiryDate"),
            "riskLevel": version.get("riskLevel"),
            "originalText": version.get("originalText"),
            "aiAnalysis": version.get("aiAnalysis"),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Contract restored to version {version_num}", "newVersion": new_version}


@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a contract."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    if current_user["role"] not in ("admin", "manager") and contract["uploadedBy"] != current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins or the uploader can delete this contract"
        )
    
    if contract.get("storageKey"):
        await delete_file_from_s3(contract["storageKey"])
    
    await db.contracts.delete_one({"id": contract_id})
    await db.chat_history.delete_many({"contractId": contract_id})
    
    await log_action(
        organization_id=current_user["organizationId"],
        user_id=current_user["sub"],
        user_email=current_user.get("email"),
        action="contract_deleted",
        resource_type="contract",
        resource_id=contract_id,
        resource_title=contract.get("title"),
    )
    
    return {"message": "Contract deleted successfully"}
