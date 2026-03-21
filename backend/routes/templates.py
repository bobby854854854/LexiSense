from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timezone
import logging

from models.template import ContractTemplate, ContractTemplateCreate, ContractTemplateResponse
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/templates", tags=["Templates"])

db = None

def init_db(database):
    global db
    db = database


# Default templates
DEFAULT_TEMPLATES = [
    {
        "name": "Non-Disclosure Agreement (NDA)",
        "description": "Standard mutual NDA for protecting confidential information between parties",
        "contractType": "NDA",
        "content": """MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] by and between:

[PARTY_A_NAME], with its principal place of business at [PARTY_A_ADDRESS] ("Party A")

and

[PARTY_B_NAME], with its principal place of business at [PARTY_B_ADDRESS] ("Party B")

(collectively referred to as the "Parties")

1. PURPOSE
The Parties wish to explore a potential business relationship ("Purpose") and in connection with this, each Party may disclose certain confidential information to the other Party.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either Party that is marked as confidential or that reasonably should be understood to be confidential given the nature of the information.

3. OBLIGATIONS
Each Party agrees to:
a) Hold the Confidential Information in strict confidence
b) Not disclose the Confidential Information to any third parties
c) Use the Confidential Information only for the Purpose
d) Protect the Confidential Information using the same degree of care it uses for its own confidential information

4. TERM
This Agreement shall remain in effect for [TERM_YEARS] years from the Effective Date.

5. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

[PARTY_A_NAME]                    [PARTY_B_NAME]
By: _________________            By: _________________
Name:                            Name:
Title:                           Title:
Date:                            Date:""",
        "fields": [
            {"name": "EFFECTIVE_DATE", "type": "date", "label": "Effective Date"},
            {"name": "PARTY_A_NAME", "type": "text", "label": "Party A Name"},
            {"name": "PARTY_A_ADDRESS", "type": "text", "label": "Party A Address"},
            {"name": "PARTY_B_NAME", "type": "text", "label": "Party B Name"},
            {"name": "PARTY_B_ADDRESS", "type": "text", "label": "Party B Address"},
            {"name": "TERM_YEARS", "type": "number", "label": "Term (Years)", "default": "2"},
            {"name": "JURISDICTION", "type": "text", "label": "Governing Law Jurisdiction"}
        ],
        "tags": ["confidentiality", "mutual", "standard"]
    },
    {
        "name": "Service Agreement",
        "description": "Standard agreement for professional services engagement",
        "contractType": "Service Agreement",
        "content": """SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] by and between:

SERVICE PROVIDER:
[PROVIDER_NAME]
[PROVIDER_ADDRESS]
("Provider")

CLIENT:
[CLIENT_NAME]
[CLIENT_ADDRESS]
("Client")

1. SERVICES
Provider agrees to provide the following services to Client:
[SERVICE_DESCRIPTION]

2. COMPENSATION
Client agrees to pay Provider [PAYMENT_AMOUNT] for the Services, payable as follows:
[PAYMENT_TERMS]

3. TERM
This Agreement shall commence on [START_DATE] and continue until [END_DATE], unless terminated earlier in accordance with this Agreement.

4. TERMINATION
Either party may terminate this Agreement with [NOTICE_DAYS] days written notice to the other party.

5. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information shared during the engagement.

6. LIMITATION OF LIABILITY
Provider's total liability under this Agreement shall not exceed the total fees paid by Client.

7. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

IN WITNESS WHEREOF, the Parties have executed this Agreement.

PROVIDER:                         CLIENT:
By: _________________            By: _________________
Name:                            Name:
Title:                           Title:
Date:                            Date:""",
        "fields": [
            {"name": "EFFECTIVE_DATE", "type": "date", "label": "Effective Date"},
            {"name": "PROVIDER_NAME", "type": "text", "label": "Provider Name"},
            {"name": "PROVIDER_ADDRESS", "type": "text", "label": "Provider Address"},
            {"name": "CLIENT_NAME", "type": "text", "label": "Client Name"},
            {"name": "CLIENT_ADDRESS", "type": "text", "label": "Client Address"},
            {"name": "SERVICE_DESCRIPTION", "type": "textarea", "label": "Service Description"},
            {"name": "PAYMENT_AMOUNT", "type": "text", "label": "Payment Amount"},
            {"name": "PAYMENT_TERMS", "type": "textarea", "label": "Payment Terms"},
            {"name": "START_DATE", "type": "date", "label": "Start Date"},
            {"name": "END_DATE", "type": "date", "label": "End Date"},
            {"name": "NOTICE_DAYS", "type": "number", "label": "Notice Period (Days)", "default": "30"},
            {"name": "JURISDICTION", "type": "text", "label": "Governing Law Jurisdiction"}
        ],
        "tags": ["services", "professional", "standard"]
    },
    {
        "name": "Employment Agreement",
        "description": "Standard employment contract for full-time employees",
        "contractType": "Employment",
        "content": """EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] by and between:

EMPLOYER:
[EMPLOYER_NAME]
[EMPLOYER_ADDRESS]
("Employer")

EMPLOYEE:
[EMPLOYEE_NAME]
[EMPLOYEE_ADDRESS]
("Employee")

1. POSITION AND DUTIES
Employer hereby employs Employee as [JOB_TITLE]. Employee shall perform the duties and responsibilities customarily associated with such position.

2. COMPENSATION
a) Base Salary: [ANNUAL_SALARY] per year, payable [PAYMENT_FREQUENCY]
b) Benefits: Employee shall be entitled to participate in Employer's standard benefits programs

3. START DATE
Employee's employment shall commence on [START_DATE].

4. EMPLOYMENT TYPE
This is a [EMPLOYMENT_TYPE] position.

5. CONFIDENTIALITY
Employee agrees to maintain strict confidentiality of all proprietary information.

6. TERMINATION
Either party may terminate this Agreement with [NOTICE_DAYS] days written notice.

7. GOVERNING LAW
This Agreement shall be governed by the laws of [JURISDICTION].

IN WITNESS WHEREOF, the Parties have executed this Agreement.

EMPLOYER:                         EMPLOYEE:
By: _________________            Signature: _________________
Name:                            Name: [EMPLOYEE_NAME]
Title:                           Date:
Date:""",
        "fields": [
            {"name": "EFFECTIVE_DATE", "type": "date", "label": "Effective Date"},
            {"name": "EMPLOYER_NAME", "type": "text", "label": "Employer Name"},
            {"name": "EMPLOYER_ADDRESS", "type": "text", "label": "Employer Address"},
            {"name": "EMPLOYEE_NAME", "type": "text", "label": "Employee Name"},
            {"name": "EMPLOYEE_ADDRESS", "type": "text", "label": "Employee Address"},
            {"name": "JOB_TITLE", "type": "text", "label": "Job Title"},
            {"name": "ANNUAL_SALARY", "type": "text", "label": "Annual Salary"},
            {"name": "PAYMENT_FREQUENCY", "type": "select", "label": "Payment Frequency", "options": ["weekly", "bi-weekly", "monthly"]},
            {"name": "START_DATE", "type": "date", "label": "Start Date"},
            {"name": "EMPLOYMENT_TYPE", "type": "select", "label": "Employment Type", "options": ["full-time", "part-time", "contract"]},
            {"name": "NOTICE_DAYS", "type": "number", "label": "Notice Period (Days)", "default": "14"},
            {"name": "JURISDICTION", "type": "text", "label": "Governing Law Jurisdiction"}
        ],
        "tags": ["employment", "hr", "standard"]
    }
]


@router.get("", response_model=List[ContractTemplateResponse])
async def list_templates(
    search: Optional[str] = None,
    contract_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all available templates (organization's own + public templates)."""
    query = {
        "$or": [
            {"organizationId": current_user["organizationId"]},
            {"isPublic": True}
        ]
    }
    
    if search:
        query["$and"] = [{"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]}]
    
    if contract_type:
        query["contractType"] = contract_type
    
    templates = await db.templates.find(query, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    # Add default templates if no custom ones exist
    if len(templates) == 0:
        for template_data in DEFAULT_TEMPLATES:
            templates.append({
                "id": f"default-{template_data['contractType'].lower().replace(' ', '-')}",
                "organizationId": "system",
                "name": template_data["name"],
                "description": template_data["description"],
                "contractType": template_data["contractType"],
                "content": template_data["content"],
                "fields": template_data["fields"],
                "tags": template_data["tags"],
                "isPublic": True,
                "createdBy": "system",
                "createdAt": datetime.now(timezone.utc).isoformat()
            })
    
    result = []
    for t in templates:
        creator = None
        if t.get("createdBy") and t["createdBy"] != "system":
            creator = await db.users.find_one({"id": t["createdBy"]}, {"_id": 0, "email": 1})
        
        result.append(ContractTemplateResponse(
            id=t["id"],
            name=t["name"],
            description=t.get("description"),
            contractType=t["contractType"],
            content=t["content"],
            fields=t.get("fields", []),
            tags=t.get("tags", []),
            isPublic=t.get("isPublic", False),
            createdBy=t["createdBy"],
            createdByEmail=creator["email"] if creator else "System",
            createdAt=t["createdAt"]
        ))
    
    return result


@router.get("/default")
async def get_default_templates():
    """Get built-in default templates."""
    return DEFAULT_TEMPLATES


@router.get("/{template_id}", response_model=ContractTemplateResponse)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific template."""
    # Check for default templates
    if template_id.startswith("default-"):
        for t in DEFAULT_TEMPLATES:
            if f"default-{t['contractType'].lower().replace(' ', '-')}" == template_id:
                return ContractTemplateResponse(
                    id=template_id,
                    name=t["name"],
                    description=t["description"],
                    contractType=t["contractType"],
                    content=t["content"],
                    fields=t["fields"],
                    tags=t["tags"],
                    isPublic=True,
                    createdBy="system",
                    createdByEmail="System",
                    createdAt=datetime.now(timezone.utc).isoformat()
                )
    
    template = await db.templates.find_one(
        {
            "id": template_id,
            "$or": [
                {"organizationId": current_user["organizationId"]},
                {"isPublic": True}
            ]
        },
        {"_id": 0}
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    creator = None
    if template.get("createdBy") and template["createdBy"] != "system":
        creator = await db.users.find_one({"id": template["createdBy"]}, {"_id": 0, "email": 1})
    
    return ContractTemplateResponse(
        id=template["id"],
        name=template["name"],
        description=template.get("description"),
        contractType=template["contractType"],
        content=template["content"],
        fields=template.get("fields", []),
        tags=template.get("tags", []),
        isPublic=template.get("isPublic", False),
        createdBy=template["createdBy"],
        createdByEmail=creator["email"] if creator else "System",
        createdAt=template["createdAt"]
    )


@router.post("", response_model=ContractTemplateResponse)
async def create_template(
    template_data: ContractTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new template."""
    template = ContractTemplate(
        organizationId=current_user["organizationId"],
        name=template_data.name,
        description=template_data.description,
        contractType=template_data.contractType,
        content=template_data.content,
        fields=template_data.fields,
        tags=template_data.tags,
        createdBy=current_user["sub"]
    )
    
    template_doc = template.model_dump()
    await db.templates.insert_one(template_doc)
    
    creator = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "email": 1})
    
    return ContractTemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        contractType=template.contractType,
        content=template.content,
        fields=template.fields,
        tags=template.tags,
        isPublic=template.isPublic,
        createdBy=template.createdBy,
        createdByEmail=creator["email"] if creator else None,
        createdAt=template.createdAt
    )


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a template."""
    if template_id.startswith("default-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default templates"
        )
    
    result = await db.templates.delete_one({
        "id": template_id,
        "organizationId": current_user["organizationId"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Template deleted successfully"}
