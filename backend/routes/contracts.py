from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
import logging
import uuid

from models.contract import Contract, ContractCreate, ContractResponse, ChatMessage, ChatResponse
from utils.auth import get_current_user
from services.ai_service import analyze_contract, get_chat_response
from services.storage_service import upload_file_to_s3, delete_file_from_s3
from services.pdf_service import extract_text_from_file

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
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all contracts for the user's organization."""
    query = {"organizationId": current_user["organizationId"]}
    
    if status_filter:
        query["status"] = status_filter
    if contract_type:
        query["contractType"] = contract_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"counterparty": {"$regex": search, "$options": "i"}}
        ]
    
    contracts = await db.contracts.find(query, {"_id": 0, "originalText": 0}).sort("createdAt", -1).to_list(1000)
    
    result = []
    for c in contracts:
        uploader = await db.users.find_one({"id": c.get("uploadedBy")}, {"_id": 0, "email": 1})
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
            uploaderEmail=uploader["email"] if uploader else None
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
        status="active",
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
    status: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update a contract's metadata."""
    contract = await db.contracts.find_one(
        {"id": contract_id, "organizationId": current_user["organizationId"]}
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    update_data = {"updatedAt": datetime.now(timezone.utc).isoformat()}
    if title is not None:
        update_data["title"] = title
    if counterparty is not None:
        update_data["counterparty"] = counterparty
    if contractType is not None:
        update_data["contractType"] = contractType
    if status is not None:
        update_data["status"] = status
    if tags is not None:
        update_data["tags"] = tags
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": update_data}
    )
    
    return {"message": "Contract updated successfully"}


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
    
    if current_user["role"] != "admin" and contract["uploadedBy"] != current_user["sub"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins or the uploader can delete this contract"
        )
    
    if contract.get("storageKey"):
        await delete_file_from_s3(contract["storageKey"])
    
    await db.contracts.delete_one({"id": contract_id})
    await db.chat_history.delete_many({"contractId": contract_id})
    
    return {"message": "Contract deleted successfully"}
