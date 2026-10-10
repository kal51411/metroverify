from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil
import hashlib

from app.database import get_db
from app.models.inspections import (
    Inspection, InspectionTestStep, TestMeasurement, SealRecord,
    InspectionEvidence
)
from app.models.applications import Application
from app.models.users import RoleEnum, User
from app.schemas.inspections import (
    CompleteInspectionInput, InspectionOut, TestMeasurementOut
)
from app.services.inspection_service import InspectionService
from app.services.audit_service import AuditService
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/api/inspections", tags=["inspections"])

_ALLOWED_EVIDENCE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
_ALLOWED_EVIDENCE_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
_MAX_EVIDENCE_SIZE_BYTES = 15 * 1024 * 1024


def _validate_evidence_upload(file_name: str, mime_type: str, raw: bytes):
    ext = os.path.splitext(file_name or "")[1].lower()
    if ext not in _ALLOWED_EVIDENCE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported evidence file extension")
    if (mime_type or "").lower() not in _ALLOWED_EVIDENCE_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported evidence MIME type")
    if len(raw) > _MAX_EVIDENCE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Evidence file exceeds size limit")

@router.get("/application/{application_id}", response_model=InspectionOut)
def get_inspection_by_application(
    application_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    insp = db.query(Inspection).options(
        joinedload(Inspection.steps),
        joinedload(Inspection.measurements),
        joinedload(Inspection.seals),
        joinedload(Inspection.evidences)
    ).filter(Inspection.application_id == application_id).first()
    
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found for this application")
    return InspectionOut.model_validate(insp)

@router.post("/application/{application_id}/start")
def start_inspection(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    insp = InspectionService.start_inspection(db, application_id, current_user.id)
    return {
        "message": "Inspection started",
        "inspection_id": insp.id,
        "inspection_ref": insp.inspection_id,
        "status": insp.status
    }

@router.post("/application/{application_id}/complete")
def complete_inspection(
    application_id: int,
    payload: CompleteInspectionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    result = InspectionService.execute_and_complete_inspection(
        db=db,
        application_id=application_id,
        input_data=payload,
        inspector_id=current_user.id
    )
    return result

@router.post("/{inspection_id}/evidence")
async def upload_evidence(
    inspection_id: int,
    evidence_type: str = Form(...),
    step_key: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    os.makedirs("uploads/evidence", exist_ok=True)
    safe_name = os.path.basename(file.filename or "evidence.jpg")
    content = await file.read()
    _validate_evidence_upload(safe_name, file.content_type or "", content)
    file_ext = os.path.splitext(safe_name)[1]
    saved_filename = f"ev_{uuid.uuid4().hex[:12]}{file_ext}"
    saved_path = os.path.join("uploads/evidence", saved_filename)
    
    hasher = hashlib.sha256()
    with open(saved_path, "wb") as buffer:
        hasher.update(content)
        buffer.write(content)
        
    file_hash = hasher.hexdigest()
    
    evidence = InspectionEvidence(
        inspection_id=insp.id,
        step_key=step_key,
        evidence_type=evidence_type,
        file_path=saved_path,
        file_hash=file_hash,
        caption=caption or safe_name,
        notes=notes,
        latitude=latitude,
        longitude=longitude,
        captured_at=datetime.utcnow(),
        captured_by=current_user.full_name
    )
    db.add(evidence)
    
    AuditService.log_event(
        db=db,
        action="EVIDENCE_CAPTURED",
        entity_type="InspectionEvidence",
        entity_id=str(insp.id),
        user_role="INSPECTOR",
        new_value={"type": evidence_type, "file_hash": file_hash}
    )
    
    db.commit()
    return {"message": "Evidence uploaded and hashed successfully", "file_hash": file_hash}

@router.patch("/measurements/{measurement_id}/correct")
def correct_measurement(
    measurement_id: int,
    corrected_observed_value: float,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    meas = db.query(TestMeasurement).filter(TestMeasurement.id == measurement_id).first()
    if not meas:
        raise HTTPException(status_code=404, detail="Measurement record not found")
        
    old_val = meas.observed_value
    meas.observed_value = corrected_observed_value
    meas.error = round(corrected_observed_value - meas.standard_value, 6)
    meas.error_percentage = round((meas.error / meas.standard_value) * 100, 4) if meas.standard_value > 0 else 0.0
    meas.within_mpe = abs(meas.error) <= (meas.mpe + 1e-9)
    meas.correction_reason = reason
    user_name = getattr(current_user, "full_name", None) or "Inspector (Verified)"
    meas.corrected_by = user_name
    
    AuditService.log_event(
        db=db,
        action="RAW_MEASUREMENT_CORRECTED",
        entity_type="TestMeasurement",
        entity_id=str(measurement_id),
        user_role=getattr(current_user, "role", "INSPECTOR"),
        old_value={"observed_value": old_val},
        new_value={"observed_value": corrected_observed_value, "within_mpe": meas.within_mpe},
        reason=reason
    )
    
    db.commit()
    return {"message": "Measurement corrected and historical audit logged", "measurement": TestMeasurementOut.model_validate(meas)}
