from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import Application, Certificate, Instrument
from schemas import (
    ApplicationOut,
    ScheduleRequest,
    RejectRequest,
    OfficerStats,
    BusinessStats,
    AdminEnforcementStats,
    ApplicationCreate,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationOut])
def get_applications(
    status: Optional[str] = None,
    district: Optional[str] = None,
    allocated_to_type: Optional[str] = None,
    application_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.certificate)
    )
    if status and status != "ALL":
        query = query.filter(Application.status == status)
    if district and district != "ALL":
        query = query.filter(Application.district == district)
    if allocated_to_type and allocated_to_type != "ALL":
        query = query.filter(Application.allocated_to_type == allocated_to_type)
    if application_type and application_type != "ALL":
        query = query.filter(Application.application_type == application_type)

    return query.order_by(Application.submitted_at.desc()).all()


@router.post("/reverify", response_model=dict)
def apply_reverification(body: ApplicationCreate, db: Session = Depends(get_db)):
    instrument = db.query(Instrument).filter(Instrument.id == body.instrument_id).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    year = datetime.utcnow().year
    app_count = db.query(Application).count()
    application_id = f"LM-REVER-{year}-{str(app_count + 1).zfill(3)}"

    application = Application(
        application_id=application_id,
        instrument_id=instrument.id,
        application_type="RE_VERIFICATION",
        status="SUBMITTED",
        district=instrument.district or body.district or "Pune",
        priority="HIGH",
        notes=body.notes or f"Annual statutory re-verification application under Rule 27 for {instrument.type}",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "application_id": application.id,
        "application_ref": application.application_id,
        "instrument_ref": instrument.instrument_id,
        "message": f"Statutory Re-verification application {application.application_id} submitted successfully.",
    }


@router.get("/stats/business", response_model=BusinessStats)
def get_business_stats(db: Session = Depends(get_db)):
    total_instruments = db.query(Instrument).count()
    total_applications = db.query(Application).count()
    under_verification = db.query(Application).filter(
        Application.status.in_(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "SCHEDULED", "UNDER_INSPECTION"])
    ).count()
    verified = db.query(Application).filter(Application.status == "VERIFIED").count()

    now = datetime.utcnow()
    soon = now + timedelta(days=90)
    expiring_soon = db.query(Certificate).filter(
        Certificate.valid_until <= soon,
        Certificate.valid_until >= now
    ).count()

    return BusinessStats(
        total_instruments=total_instruments,
        total_applications=total_applications,
        under_verification=under_verification,
        verified=verified,
        expiring_soon=expiring_soon,
    )


@router.get("/stats/officer", response_model=OfficerStats)
def get_officer_stats(db: Session = Depends(get_db)):
    pending = db.query(Application).filter(
        Application.status.in_(["SUBMITTED", "UNDER_REVIEW", "APPROVED"])
    ).count()
    scheduled = db.query(Application).filter(Application.status == "SCHEDULED").count()
    under_inspection = db.query(Application).filter(Application.status == "UNDER_INSPECTION").count()
    verified = db.query(Application).filter(Application.status == "VERIFIED").count()
    failed = db.query(Application).filter(Application.status == "FAILED").count()

    now = datetime.utcnow()
    soon = now + timedelta(days=90)
    expiring_soon = db.query(Certificate).filter(
        Certificate.valid_until <= soon,
        Certificate.valid_until >= now
    ).count()

    gatc_assigned = db.query(Application).filter(Application.allocated_to_type == "GATC").count()

    return OfficerStats(
        pending=pending,
        scheduled=scheduled,
        under_inspection=under_inspection,
        verified=verified,
        failed=failed,
        expiring_soon=expiring_soon,
        gatc_assigned=gatc_assigned,
    )


@router.get("/stats/admin", response_model=AdminEnforcementStats)
def get_admin_enforcement_stats(db: Session = Depends(get_db)):
    total_instruments = db.query(Instrument).count()
    total_applications = db.query(Application).count()
    verified_count = db.query(Application).filter(Application.status == "VERIFIED").count()

    now = datetime.utcnow()
    total_active_stamped = db.query(Certificate).filter(
        Certificate.valid_until >= now,
        Certificate.result == "PASS"
    ).count()

    overdue = db.query(Certificate).filter(Certificate.valid_until < now).count()

    comp_rate = round((verified_count / max(total_applications, 1)) * 100, 1)

    # District breakdown
    districts = ["Pune", "Mumbai", "Thane", "Nagpur", "Nashik"]
    breakdown = []
    for d in districts:
        total_d = db.query(Application).filter(Application.district == d).count()
        verified_d = db.query(Application).filter(Application.district == d, Application.status == "VERIFIED").count()
        pending_d = db.query(Application).filter(
            Application.district == d,
            Application.status.in_(["SUBMITTED", "UNDER_REVIEW", "SCHEDULED", "UNDER_INSPECTION"])
        ).count()
        breakdown.append({
            "district": d,
            "total_applications": total_d,
            "verified": verified_d,
            "pending": pending_d,
            "compliance_rate": f"{round((verified_d / max(total_d, 1)) * 100)}%",
        })

    return AdminEnforcementStats(
        total_instruments_statewide=total_instruments,
        total_applications=total_applications,
        compliance_rate_percent=comp_rate,
        total_stamped_active=total_active_stamped,
        overdue_reverifications=overdue,
        gatc_centers_active=4,
        lmo_officers_active=12,
        district_breakdown=breakdown,
    )


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.certificate)
    ).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/{application_id}/approve")
def approve_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ["SUBMITTED", "UNDER_REVIEW"]:
        raise HTTPException(status_code=400, detail=f"Cannot approve application in status: {app.status}")
    app.status = "APPROVED"
    app.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "Application approved", "status": app.status}


@router.patch("/{application_id}/reject")
def reject_application(application_id: int, body: RejectRequest, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "REJECTED"
    app.reviewed_at = datetime.utcnow()
    if body.notes:
        app.notes = body.notes
    db.commit()
    return {"message": "Application rejected", "status": app.status}


@router.patch("/{application_id}/schedule")
def schedule_inspection(
    application_id: int,
    body: ScheduleRequest,
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Cannot schedule inspection for application in status: {app.status}")

    app.status = "SCHEDULED"
    app.inspection_date = body.inspection_date
    app.inspection_time = body.inspection_time
    app.test_centre = body.test_centre
    app.assigned_officer = body.officer
    app.allocated_to_type = body.allocated_to_type or "LMO"
    if body.gatc_name:
        app.gatc_name = body.gatc_name
    app.scheduled_at = datetime.utcnow()
    db.commit()
    return {
        "message": f"Verification inspection scheduled with {app.allocated_to_type}",
        "status": app.status,
        "allocated_to_type": app.allocated_to_type,
    }
