from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.database import get_db
from app.models.gatc import GATCCentre
from app.models.applications import Application, ApplicationStatusEnum
from app.schemas.applications import ApplicationOut

router = APIRouter(prefix="/api/gatc", tags=["gatc"])

class GATCCentreCreate(BaseModel):
    name: str
    notification_number: str
    notification_date: Optional[datetime] = None
    accreditation_body: str = "NABL / RRSL"
    valid_until: datetime
    authorized_signatory: str
    signatory_designation: str = "Director & Technical Head"
    contact_email: EmailStr
    contact_phone: str
    address: str
    district: str
    division: str
    scope_of_testing: str

class GATCCentreOut(BaseModel):
    id: int
    gatc_id: str
    name: str
    notification_number: str
    notification_date: Optional[datetime] = None
    accreditation_body: str
    valid_until: datetime
    authorized_signatory: str
    signatory_designation: str
    contact_email: str
    contact_phone: str
    address: str
    district: str
    division: str
    scope_of_testing: str
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/centres", response_model=List[GATCCentreOut])
def list_gatc_centres(
    district: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all Government Approved Test Centres (GATCs) notified under Section 14.
    """
    q = db.query(GATCCentre)
    if active_only:
        q = q.filter(GATCCentre.is_active == True)
    if district and district != "ALL":
        q = q.filter(GATCCentre.district.ilike(district.strip()))
    return [GATCCentreOut.model_validate(c) for c in q.all()]

@router.get("/centres/{centre_id}", response_model=GATCCentreOut)
def get_gatc_centre(centre_id: int, db: Session = Depends(get_db)):
    c = db.query(GATCCentre).filter(GATCCentre.id == centre_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="GATC Centre not found")
    return GATCCentreOut.model_validate(c)

@router.get("/my-queue", response_model=List[ApplicationOut])
def get_gatc_allocated_queue(
    gatc_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List verification requests allocated to GATC centres for testing.
    """
    q = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.documents),
        joinedload(Application.payments),
        joinedload(Application.queries)
    ).filter(Application.allocation_target == "GATC")

    if gatc_id:
        q = q.filter(Application.assigned_gatc_id == gatc_id)

    return [ApplicationOut.model_validate(a) for a in q.order_by(Application.submitted_at.desc()).all()]

@router.post("/centres", response_model=GATCCentreOut, status_code=status.HTTP_201_CREATED)
def register_gatc_centre(payload: GATCCentreCreate, db: Session = Depends(get_db)):
    """
    Register a newly notified Government Approved Test Centre.
    """
    existing = db.query(GATCCentre).filter(GATCCentre.notification_number == payload.notification_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Notification number is already registered.")

    count = db.query(GATCCentre).count() + 1
    code = f"GATC-MH-{payload.district[:3].upper()}-{str(count).zfill(2)}"

    centre = GATCCentre(
        gatc_id=code,
        name=payload.name,
        notification_number=payload.notification_number,
        notification_date=payload.notification_date or datetime.utcnow(),
        accreditation_body=payload.accreditation_body,
        valid_until=payload.valid_until,
        authorized_signatory=payload.authorized_signatory,
        signatory_designation=payload.signatory_designation,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        address=payload.address,
        district=payload.district,
        division=payload.division,
        scope_of_testing=payload.scope_of_testing,
        is_active=True
    )
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return GATCCentreOut.model_validate(centre)
