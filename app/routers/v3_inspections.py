import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User, RoleEnum
from app.models.inspections import Inspection, TestMeasurement
from app.models.instruments import Instrument
from app.services.audit_service import AuditService
from app.routers.v3_auth import get_current_user, require_role

router = APIRouter(prefix="/api/v3/inspections", tags=["v3-inspections"])

class GeoCoordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, example=18.5204)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=73.8567)
    accuracy_meters: Optional[float] = Field(None, example=4.5)

class ChecklistItem(BaseModel):
    key: str
    label: str
    passed: bool
    notes: Optional[str] = None

class TestMeasurementInput(BaseModel):
    step_key: str = "indication_error"
    load_target: float
    standard_value: float
    observed_value: float
    error: float
    mpe: float
    within_mpe: bool

class ExecuteInspectionRequest(BaseModel):
    application_id: int
    instrument_id: int
    verification_mode: str = "INITIAL"
    geo: GeoCoordinates
    inspection_address: str
    checklist: List[ChecklistItem]
    measurements: List[TestMeasurementInput]
    ambient_temperature_c: Optional[float] = 25.0
    relative_humidity_pct: Optional[float] = 55.0
    notes: Optional[str] = None

class InspectionResponse(BaseModel):
    inspection_id: str
    application_id: int
    instrument_id: int
    inspector_id: int
    inspector_name: str
    verification_mode: str
    geo_latitude: float
    geo_longitude: float
    status: str
    final_result: str
    decision_summary: str
    audit_hash: str
    timestamp: str

def compute_inspection_audit_hash(data: Dict[str, Any]) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

@router.post("/execute", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def execute_geo_inspection(
    payload: ExecuteInspectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.INSPECTOR, RoleEnum.ADMIN]))
):
    instrument = db.query(Instrument).filter(Instrument.id == payload.instrument_id).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found.")

    all_checklist_passed = all(item.passed for item in payload.checklist)
    all_measurements_passed = all(m.within_mpe for m in payload.measurements) if payload.measurements else True
    final_result = "PASS" if (all_checklist_passed and all_measurements_passed) else "FAIL"

    fail_reasons = []
    if not all_checklist_passed:
        failed_items = [item.label for item in payload.checklist if not item.passed]
        fail_reasons.append(f"Visual checklist failed: {', '.join(failed_items)}")
    if not all_measurements_passed:
        fail_reasons.append("Load measurements exceeded Maximum Permissible Error (MPE) thresholds")

    decision_summary = (
        "Instrument satisfies all statutory Legal Metrology requirements."
        if final_result == "PASS"
        else f"Verification rejected: {'; '.join(fail_reasons)}"
    )

    now_utc = datetime.now(timezone.utc)
    insp_code = f"LM-INS-V3-{now_utc.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    audit_payload = {
        "inspection_code": insp_code,
        "application_id": payload.application_id,
        "instrument_id": payload.instrument_id,
        "inspector_id": current_user.id,
        "geo_lat": payload.geo.latitude,
        "geo_lon": payload.geo.longitude,
        "result": final_result,
        "timestamp": now_utc.isoformat()
    }
    audit_hash = compute_inspection_audit_hash(audit_payload)

    inspection = Inspection(
        inspection_id=insp_code,
        application_id=payload.application_id,
        instrument_id=payload.instrument_id,
        inspector_id=current_user.id,
        ruleset_version="Legal Metrology (General) Rules, 2011 (Amended 2026)",
        status="PASSED" if final_result == "PASS" else "FAILED",
        visual_inspection_status="PASS" if all_checklist_passed else "FAIL",
        indication_test_status="PASS" if all_measurements_passed else "FAIL",
        final_result=final_result,
        decision_summary=decision_summary,
        ambient_temperature_c=payload.ambient_temperature_c,
        relative_humidity_pct=payload.relative_humidity_pct,
        test_location=f"{payload.inspection_address} ({payload.geo.latitude:.4f}, {payload.geo.longitude:.4f})",
        started_at=now_utc,
        completed_at=now_utc
    )
    db.add(inspection)
    db.flush()

    for idx, m in enumerate(payload.measurements):
        meas = TestMeasurement(
            inspection_id=inspection.id,
            step_key=m.step_key,
            load_target=m.load_target,
            standard_value=m.standard_value,
            observed_value=m.observed_value,
            error=m.error,
            error_percentage=(m.error / m.standard_value * 100.0) if m.standard_value else 0.0,
            verification_interval_count=m.load_target / (instrument.verification_scale_interval_e or 1.0),
            mpe=m.mpe,
            within_mpe=m.within_mpe,
            run_index=idx + 1,
            is_accepted=True,
            timestamp=now_utc
        )
        db.add(meas)

    AuditService.log_event(
        db=db,
        action="EXECUTE_GEO_INSPECTION_V3",
        entity_type="INSPECTION",
        entity_id=insp_code,
        user_id=str(current_user.id),
        user_role=current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        new_value={
            "result": final_result,
            "geo": {"lat": payload.geo.latitude, "lon": payload.geo.longitude},
            "audit_hash": audit_hash,
            "address": payload.inspection_address
        }
    )

    db.commit()

    return InspectionResponse(
        inspection_id=insp_code,
        application_id=payload.application_id,
        instrument_id=payload.instrument_id,
        inspector_id=current_user.id,
        inspector_name=current_user.full_name or current_user.username,
        verification_mode=payload.verification_mode,
        geo_latitude=payload.geo.latitude,
        geo_longitude=payload.geo.longitude,
        status=inspection.status,
        final_result=final_result,
        decision_summary=decision_summary,
        audit_hash=audit_hash,
        timestamp=now_utc.isoformat()
    )

@router.get("/{inspection_id}")
def get_inspection_details(
    inspection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    insp = db.query(Inspection).filter(Inspection.inspection_id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found.")
    
    return {
        "inspection_id": insp.inspection_id,
        "application_id": insp.application_id,
        "instrument_id": insp.instrument_id,
        "inspector_id": insp.inspector_id,
        "status": insp.status,
        "final_result": insp.final_result,
        "decision_summary": insp.decision_summary,
        "test_location": insp.test_location,
        "started_at": insp.started_at.isoformat() if insp.started_at else None,
        "completed_at": insp.completed_at.isoformat() if insp.completed_at else None,
        "measurements_count": len(insp.measurements)
    }
