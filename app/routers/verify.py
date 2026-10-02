from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.certificate_service import CertificateService
from app.schemas.certificates import CertificateVerifyResponse

router = APIRouter(prefix="/api/verify", tags=["verify"])

@router.get("/{certificate_ref}", response_model=CertificateVerifyResponse)
def verify_certificate_public(certificate_ref: str, db: Session = Depends(get_db)):
    res = CertificateService.verify_public_certificate(db, certificate_ref)
    return CertificateVerifyResponse(**res)
