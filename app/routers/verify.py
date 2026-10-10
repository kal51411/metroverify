from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.certificate_service import CertificateService
from app.schemas.certificates import CertificateVerifyResponse

router = APIRouter(prefix="/api/verify", tags=["verify"])

@router.get("/lookup", response_model=CertificateVerifyResponse)
def lookup_certificate_public(query: str = Query(..., description="Certificate ID, Serial Number, or QR token"), db: Session = Depends(get_db)):
    res = CertificateService.verify_public_certificate(db, query)
    return CertificateVerifyResponse(**res)

@router.get("/{certificate_ref}", response_model=CertificateVerifyResponse)
def verify_certificate_public(certificate_ref: str, db: Session = Depends(get_db)):
    res = CertificateService.verify_public_certificate(db, certificate_ref)
    return CertificateVerifyResponse(**res)
