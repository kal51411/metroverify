from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import uuid

from database import get_db
from models import Application, Inspection, InspectionResult
from schemas import InspectionCreate, InspectionOut

router = APIRouter(prefix="/api/inspections", tags=["inspections"])


@router.get("/application/{application_id}", response_model=InspectionOut)
def get_inspection_by_application(application_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).options(
        joinedload(Inspection.results)
    ).filter(Inspection.application_id == application_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


@router.post("/application/{application_id}/start")
def start_inspection(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ["SCHEDULED", "UNDER_INSPECTION"]:
        raise HTTPException(status_code=400, detail=f"Cannot start inspection for application in status: {app.status}")

    app.status = "UNDER_INSPECTION"
    db.commit()
    return {"message": "Inspection started", "status": app.status}


@router.post("/application/{application_id}/complete", response_model=dict)
def complete_inspection(
    application_id: int,
    body: InspectionCreate,
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Remove existing inspection if any
    existing = db.query(Inspection).filter(Inspection.application_id == application_id).first()
    if existing:
        db.query(InspectionResult).filter(InspectionResult.inspection_id == existing.id).delete()
        db.delete(existing)
        db.flush()

    # Calculate results
    all_pass = True
    max_error_pct = 0.0
    calc_results = []

    for r in body.results:
        error = r.observed_value - r.standard_value
        if r.standard_value != 0:
            error_pct = (error / r.standard_value) * 100
        else:
            error_pct = 0.0
        within = abs(error_pct) <= body.tolerance
        if not within:
            all_pass = False
        if abs(error_pct) > max_error_pct:
            max_error_pct = abs(error_pct)
        calc_results.append({
            "standard_value": r.standard_value,
            "observed_value": r.observed_value,
            "error": round(error, 6),
            "error_percentage": round(error_pct, 4),
            "within_tolerance": within,
        })

    result = "PASS" if all_pass else "FAIL"
    inspection_id = f"LM-INS-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    seal_no = body.stamping_seal_no
    if not seal_no and result == "PASS":
        seal_no = f"MH-26-SEAL-{uuid.uuid4().hex[:6].upper()}"

    inspection = Inspection(
        inspection_id=inspection_id,
        application_id=application_id,
        officer=body.officer,
        tolerance=body.tolerance,
        result=result,
        max_error_percentage=round(max_error_pct, 4),
        stamping_seal_no=seal_no,
        gps_location=body.gps_location or "18.5204° N, 73.8567° E (Pune Central)",
        instrument_photo=body.instrument_photo,
        seal_photo=body.seal_photo,
        is_field_inspection=body.is_field_inspection if body.is_field_inspection is not None else True,
        completed_at=datetime.utcnow(),
    )
    db.add(inspection)
    db.flush()

    for r in calc_results:
        ir = InspectionResult(
            inspection_id=inspection.id,
            standard_value=r["standard_value"],
            observed_value=r["observed_value"],
            error=r["error"],
            error_percentage=r["error_percentage"],
            within_tolerance=r["within_tolerance"],
        )
        db.add(ir)

    # Update application status and instrument last verified date
    app.status = "VERIFIED" if result == "PASS" else "FAILED"
    if result == "PASS" and app.instrument:
        app.instrument.last_verified_at = datetime.utcnow()

    db.commit()

    return {
        "inspection_id": inspection.id,
        "inspection_ref": inspection_id,
        "result": result,
        "stamping_seal_no": seal_no,
        "max_error_percentage": round(max_error_pct, 4),
        "results": calc_results,
        "application_status": app.status,
    }
