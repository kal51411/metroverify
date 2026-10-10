from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.certificates import VerificationCertificate, CertificateStatusEnum
from app.models.applications import Application
from app.models.users import RoleEnum, User
from app.schemas.certificates import CertificateOut
from app.schemas.renewals import (
    RenewalMetricsResponse,
    RenewalQueueResponse,
    RenewalReminderRequest,
)
from app.services.certificate_service import CertificateService
from app.services.pdf_service import generate_certificate_pdf
from app.services.qr_service import generate_qr_code
from app.services.renewal_service import RenewalService
from app.config import settings
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/api/certificates", tags=["certificates"])

@router.get("", response_model=List[CertificateOut])
def list_certificates(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    q = db.query(VerificationCertificate).options(
        joinedload(VerificationCertificate.instrument)
    )
    if status and status != "ALL":
        q = q.filter(VerificationCertificate.status == status)
    return [CertificateOut.model_validate(c) for c in q.order_by(VerificationCertificate.created_at.desc()).all()]

@router.get("/{certificate_id}", response_model=CertificateOut)
def get_certificate(certificate_id: int, db: Session = Depends(get_db)):
    cert = db.query(VerificationCertificate).options(
        joinedload(VerificationCertificate.instrument)
    ).filter(VerificationCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return CertificateOut.model_validate(cert)

@router.post("/application/{application_id}/generate")
def generate_certificate(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    cert = CertificateService.generate_certificate_for_application(
        db=db,
        application_id=application_id,
        officer_user_id=current_user.id
    )
    return {
        "certificate_id": cert.id,
        "certificate_number": cert.certificate_number,
        "certificate_hash": cert.certificate_hash,
        "valid_until": cert.valid_until,
        "message": "Verification Certificate generated successfully with cryptographic integrity hash."
    }

@router.get("/{certificate_id}/qr")
def get_certificate_qr(
    certificate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    cert = db.query(VerificationCertificate).filter(VerificationCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    verify_url = f"{settings.FRONTEND_URL}/verify/{cert.certificate_number}"
    qr_base64 = generate_qr_code(verify_url)
    return {
        "qr_code": qr_base64,
        "verification_url": verify_url,
        "certificate_number": cert.certificate_number,
        "certificate_hash": cert.certificate_hash
    }

@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(
    certificate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    cert = db.query(VerificationCertificate).options(
        joinedload(VerificationCertificate.instrument)
    ).filter(VerificationCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    inst = cert.instrument
    verify_url = f"{settings.FRONTEND_URL}/verify/{cert.certificate_number}"
    
    cert_data = {
        "certificate_id": cert.certificate_id,
        "certificate_number": cert.certificate_number,
        "instrument_id": inst.instrument_id,
        "instrument_type": inst.instrument_type,
        "manufacturer": inst.manufacturer,
        "model": inst.model,
        "serial_number": inst.serial_number,
        "accuracy_class": inst.accuracy_class.value,
        "max_capacity": inst.max_capacity,
        "min_capacity": inst.min_capacity,
        "e": inst.verification_scale_interval_e,
        "d": inst.actual_scale_interval_d,
        "unit": inst.unit,
        "owner_name": inst.owner_name,
        "business_name": inst.business_name,
        "address": inst.address,
        "district": inst.district,
        "division": inst.division,
        "verification_date": cert.verification_date,
        "valid_until": cert.valid_until,
        "interval_months": cert.interval_months,
        "result": cert.result,
        "officer_name": cert.officer_name,
        "office_name": cert.office_name,
        "test_location": cert.test_location,
        "fee_reference": cert.fee_reference,
        "ruleset_version": cert.ruleset_version,
        "certificate_hash": cert.certificate_hash,
        "inspection_id": cert.inspection_id
    }
    
    pdf_bytes = generate_certificate_pdf(cert_data, verify_url)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cert.certificate_number}.pdf"}
    )


@router.get("/renewals/queue", response_model=RenewalQueueResponse)
def renewal_queue(
    window_days: int = 90,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN)),
):
    return RenewalService.list_renewal_candidates(
        db=db,
        window_days=max(1, min(365, window_days)),
        page=max(1, page),
        page_size=max(1, min(100, page_size)),
        search=search,
    )


@router.get("/renewals/metrics", response_model=RenewalMetricsResponse)
def renewal_metrics(
    window_days: int = 90,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN)),
):
    return RenewalService.renewal_metrics(db=db, window_days=max(1, min(365, window_days)))


@router.post("/{certificate_id}/renewals")
def one_click_renewal(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN)),
):
    return RenewalService.create_prefilled_renewal_application(
        db=db,
        certificate_id=certificate_id,
        actor=current_user,
    )


@router.post("/{certificate_id}/renewal-reminders")
def trigger_renewal_reminder(
    certificate_id: int,
    payload: RenewalReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN)),
):
    return RenewalService.send_reminders(
        db=db,
        certificate_id=certificate_id,
        channels=payload.channels,
        actor=current_user,
        note=payload.note,
    )
