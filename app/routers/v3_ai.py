from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.v3_ocr_service import V3OCRService
from app.services.v3_mpe_service import calculate_v3_mpe
from app.models.instruments import AccuracyClassEnum

router = APIRouter(prefix="/api/v3/ai", tags=["v3-ai"])

class MpeEvalRequest(BaseModel):
    load: float
    e: float
    accuracy_class: AccuracyClassEnum
    verification_mode: str = "INITIAL"

class CopilotQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

@router.post("/ocr-plate")
async def ocr_plate_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    result = V3OCRService.parse_scale_plate_image(contents, file.filename)
    return result

@router.post("/copilot")
def copilot_query_endpoint(payload: CopilotQueryRequest):
    q = payload.query.lower()
    if "mpe" in q or "error" in q or "tolerance" in q:
        answer = "Under Legal Metrology Rules 2011 (Amended 2026), Maximum Permissible Error (MPE) for Class III medium accuracy scales is 0.5e for m <= 500e, 1.0e for 500e < m <= 2000e, and 1.5e for m > 2000e. In-service inspections permit double these initial values."
        clause = "Schedule VII, Section 12 - Non-Automatic Weighing Instruments"
    elif "substitution" in q or "weighbridge" in q:
        answer = "For high-capacity weighbridges (>= 10t), substitution of standard test weights with alternative loads is permitted provided repeatability standard deviation (sigma) over 3 consecutive tests does not exceed 0.1e."
        clause = "Rule 14(2) - High Capacity Substitution Testing"
    else:
        answer = f"MetroVerify Metrology Copilot processed your query: '{payload.query}'. All commercial weighing instruments must carry a valid QR-encrypted verification certificate under Section 24 of the Legal Metrology Act, 2009."
        clause = "Legal Metrology Act, 2009 - Section 24 General Compliance"

    return {
        "answer": answer,
        "statutory_reference": clause,
        "rule_version": "2026-R1"
    }

@router.post("/metrology/mpe")
def metrology_mpe_endpoint(payload: MpeEvalRequest):
    return calculate_v3_mpe(
        load=payload.load,
        e=payload.e,
        accuracy_class=payload.accuracy_class,
        verification_mode=payload.verification_mode
    )
