from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
import uuid

from database import get_db
from models import Application, Certificate, Inspection
from schemas import CertificateOut
from services.pdf_service import generate_certificate_pdf
from services.qr_service import generate_qr_code

router = APIRouter(prefix="/api/certificates", tags=["certificates"])

FRONTEND_BASE_URL = "http://localhost:5173"


@router.get("/{certificate_id}", response_model=CertificateOut)
def get_certificate(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).options(
        joinedload(Certificate.instrument)
    ).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.post("/application/{application_id}/generate", response_model=dict)
def generate_certificate(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.inspection)
    ).filter(Application.id == application_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ["VERIFIED"]:
        raise HTTPException(status_code=400, detail="Application must be VERIFIED to generate certificate")

    # Check if cert already exists
    existing = db.query(Certificate).filter(Certificate.application_id == application_id).first()
    if existing:
        return {
            "certificate_id": existing.id,
            "certificate_ref": existing.certificate_id,
            "message": "Certificate already exists",
        }

    year = datetime.utcnow().year
    count = db.query(Certificate).count()
    certificate_id = f"LM-CERT-{year}-{str(count + 1).zfill(3)}"
    qr_token = uuid.uuid4().hex

    verification_date = datetime.utcnow()
    valid_until = verification_date + timedelta(days=365)

    cert = Certificate(
        certificate_id=certificate_id,
        instrument_id=app.instrument_id,
        application_id=application_id,
        verification_date=verification_date,
        valid_until=valid_until,
        result="PASS",
        qr_token=qr_token,
        officer=app.assigned_officer or "Inspection Officer",
        test_centre=app.test_centre or "State Legal Metrology Lab",
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "certificate_id": cert.id,
        "certificate_ref": cert.certificate_id,
        "message": "Certificate generated successfully",
    }


@router.get("/{certificate_id}/qr")
def get_certificate_qr(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    verify_url = f"{FRONTEND_BASE_URL}/verify/{cert.certificate_id}"
    qr_base64 = generate_qr_code(verify_url)
    return {"qr_code": qr_base64, "url": verify_url}


@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certificate).options(
        joinedload(Certificate.instrument)
    ).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    inst = cert.instrument
    cert_data = {
        "certificate_id": cert.certificate_id,
        "instrument_ref": inst.instrument_id,
        "instrument_type": inst.type,
        "manufacturer": inst.manufacturer,
        "model": inst.model,
        "serial_number": inst.serial_number,
        "capacity": inst.capacity,
        "unit": inst.unit,
        "owner_name": inst.owner_name,
        "business_name": inst.business_name,
        "address": inst.address,
        "verification_date": cert.verification_date.strftime("%d %B %Y"),
        "valid_until": cert.valid_until.strftime("%d %B %Y"),
        "result": cert.result,
        "officer": cert.officer,
        "test_centre": cert.test_centre,
    }

    pdf_bytes = generate_certificate_pdf(cert_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cert.certificate_id}.pdf"},
    )
