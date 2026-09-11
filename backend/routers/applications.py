from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime

from database import get_db
from models import Application, Certificate
from schemas import ApplicationOut, ScheduleRequest, RejectRequest, OfficerStats, BusinessStats

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationOut])
def get_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.certificate)
    )
    if status and status != "ALL":
        query = query.filter(Application.status == status)
    return query.order_by(Application.submitted_at.desc()).all()


@router.get("/stats/business", response_model=BusinessStats)
def get_business_stats(db: Session = Depends(get_db)):
    from models import Instrument, Certificate
    from datetime import timedelta
    total_instruments = db.query(Instrument).count()
    total_applications = db.query(Application).count()
    under_verification = db.query(Application).filter(
        Application.status.in_(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "SCHEDULED", "UNDER_INSPECTION"])
    ).count()
    verified = db.query(Application).filter(Application.status == "VERIFIED").count()

    # Expiring soon: certs valid_until within 90 days
    now = datetime.utcnow()
    from datetime import timedelta
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
    from models import Certificate
    from datetime import timedelta
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

    return OfficerStats(
        pending=pending,
        scheduled=scheduled,
        under_inspection=under_inspection,
        verified=verified,
        failed=failed,
        expiring_soon=expiring_soon,
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
    app.scheduled_at = datetime.utcnow()
    db.commit()
    return {"message": "Inspection scheduled", "status": app.status}
