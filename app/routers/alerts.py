from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.services.alert_service import AlertService

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class AcknowledgeResponse(BaseModel):
    status: str
    alert_id: str
    state: str

class RenewResponse(BaseModel):
    status: str
    application_id: int
    application_code: str
    message: str

@router.get("")
def list_alerts(
    user_id: Optional[int] = Query(None, description="Filter by trader user id"),
    severity: Optional[str] = Query(None, description="Filter by severity: INFO, WARNING, CRITICAL, EXPIRED, ALL"),
    db: Session = Depends(get_db)
):
    """
    Returns statutory validity alerts for upcoming expirations and overdue instruments.
    """
    return AlertService.get_alerts(db=db, user_id=user_id, severity=severity)

@router.post("/generate")
def trigger_validity_scan(db: Session = Depends(get_db)):
    """
    Triggers automated statutory scanning across all instruments and certificates.
    """
    result = AlertService.scan_and_generate_alerts(db=db)
    return result

@router.patch("/{alert_id}/acknowledge", response_model=AcknowledgeResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """
    Acknowledges an alert notice.
    """
    return AlertService.acknowledge_alert(db=db, alert_id=alert_id)

@router.post("/{alert_id}/renew", response_model=RenewResponse)
def execute_1click_renewal(alert_id: int, applicant_id: int = Query(1), db: Session = Depends(get_db)):
    """
    Expedites and executes a 1-click statutory re-verification application submission
    for an expiring or expired instrument.
    """
    return AlertService.execute_1click_renewal(db=db, alert_id=alert_id, applicant_id=applicant_id)
