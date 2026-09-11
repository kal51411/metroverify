from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from database import get_db
from models import Certificate
from schemas import VerifyResponse

router = APIRouter(prefix="/api/verify", tags=["verify"])


def get_expiry_status(valid_until: datetime) -> str:
    now = datetime.utcnow()
    diff = (valid_until - now).days
    if diff < 0:
        return "EXPIRED"
    elif diff < 30:
        return "EXPIRING"
    elif diff < 90:
        return "EXPIRING_SOON"
    else:
        return "ACTIVE"


@router.get("/{certificate_ref}", response_model=VerifyResponse)
def verify_certificate(certificate_ref: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).options(
        joinedload(Certificate.instrument)
    ).filter(Certificate.certificate_id == certificate_ref).first()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    inst = cert.instrument
    now = datetime.utcnow()
    is_expired = cert.valid_until < now
    status = get_expiry_status(cert.valid_until)

    if is_expired:
        status_label = "EXPIRED"
    elif cert.result != "PASS":
        status_label = "FAILED"
    else:
        status_label = status

    return VerifyResponse(
        certificate_id=cert.certificate_id,
        instrument_id=inst.instrument_id,
        instrument_type=inst.type,
        manufacturer=inst.manufacturer,
        model=inst.model,
        serial_number=inst.serial_number,
        owner_name=inst.owner_name,
        business_name=inst.business_name,
        verification_date=cert.verification_date,
        valid_until=cert.valid_until,
        result=cert.result,
        officer=cert.officer,
        test_centre=cert.test_centre,
        allocated_to_type=cert.allocated_to_type or "LMO",
        verification_type=cert.verification_type or "VERIFICATION",
        stamping_seal_no=cert.stamping_seal_no or "MH-26-SEAL-8391",
        district=cert.district or "Pune",
        is_valid=not is_expired and cert.result == "PASS",
        is_expired=is_expired,
        status_label=status_label,
    )
