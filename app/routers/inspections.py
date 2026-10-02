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
from app.schemas.inspections import (
    CompleteInspectionInput, InspectionOut, TestMeasurementOut
)
from app.services.inspection_service import InspectionService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/inspections", tags=["inspections"])

@router.get("/application/{application_id}", response_model=InspectionOut)
def get_inspection_by_application(application_id: int, db: Session = Depends(get_db)):
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
    inspector_id: int = 2,
    db: Session = Depends(get_db)
):
    insp = InspectionService.start_inspection(db, application_id, inspector_id)
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
    inspector_id: int = 2,
    db: Session = Depends(get_db)
):
    result = InspectionService.execute_and_complete_inspection(
        db=db,
        application_id=application_id,
        input_data=payload,
        inspector_id=inspector_id
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
    inspector_name: str = "Inspector Legal Metrology",
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    os.makedirs("uploads/evidence", exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    saved_filename = f"ev_{uuid.uuid4().hex[:12]}{file_ext}"
    saved_path = os.path.join("uploads/evidence", saved_filename)
    
    hasher = hashlib.sha256()
    with open(saved_path, "wb") as buffer:
        content = await file.read()
        hasher.update(content)
        buffer.write(content)
        
    file_hash = hasher.hexdigest()
    
    evidence = InspectionEvidence(
        inspection_id=insp.id,
        step_key=step_key,
        evidence_type=evidence_type,
        file_path=saved_path,
        file_hash=file_hash,
        caption=caption or file.filename,
        notes=notes,
        latitude=latitude,
        longitude=longitude,
        captured_at=datetime.utcnow(),
        captured_by=inspector_name
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
    inspector_name: str = "Inspector Legal Metrology",
    db: Session = Depends(get_db)
):
    meas = db.query(TestMeasurement).filter(TestMeasurement.id == measurement_id).first()
    if not meas:
        raise HTTPException(status_code=404, detail="Measurement record not found")
        
    old_val = meas.observed_value
    meas.observed_value = corrected_observed_value
    meas.error = round(corrected_observed_value - meas.standard_value, 6)
    meas.error_percentage = round((meas.error / meas.standard_value) * 100, 4) if meas.standard_value > 0 else 0.0
    meas.within_mpe = abs(meas.error) <= meas.mpe + 1e-9
    meas.correction_reason = reason
    meas.corrected_by = inspector_name
    
    AuditService.log_event(
        db=db,
        action="RAW_MEASUREMENT_CORRECTED",
        entity_type="TestMeasurement",
        entity_id=str(measurement_id),
        user_role="INSPECTOR",
        old_value={"observed_value": old_val},
        new_value={"observed_value": corrected_observed_value, "within_mpe": meas.within_mpe},
        reason=reason
    )
    
    db.commit()
    return {"message": "Measurement corrected and historical audit logged", "measurement": TestMeasurementOut.model_validate(meas)}
