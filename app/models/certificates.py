import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class CertificateStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    ACTIVE = "ACTIVE"
    EXPIRING_SOON = "EXPIRING_SOON"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"

class VerificationCertificate(Base):
    __tablename__ = "verification_certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, index=True, nullable=False) # LM-CERT-2026-001
    certificate_number = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    
    verification_date = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    interval_months = Column(Integer, default=12, nullable=False) # Determined by ruleset, not hardcoded
    
    result = Column(String(50), default="PASS", nullable=False)
    officer_name = Column(String(200), nullable=False)
    officer_designation = Column(String(150), nullable=False)
    office_name = Column(String(255), nullable=False)
    test_location = Column(String(255), nullable=False)
    fee_reference = Column(String(100), nullable=True) # GRAS GRN
    previous_certificate_number = Column(String(100), nullable=True)
    
    ruleset_version = Column(String(100), nullable=False)
    certificate_version = Column(String(50), default="2.0", nullable=False)
    
    qr_token = Column(String(255), unique=True, index=True, nullable=False)
    certificate_hash = Column(String(255), nullable=False) # Cryptographic integrity hash of payload
    
    status = Column(Enum(CertificateStatusEnum), default=CertificateStatusEnum.ACTIVE, nullable=False, index=True)
    revocation_reason = Column(Text, nullable=True)
    revoked_by = Column(String(150), nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("Application", back_populates="certificate")
    instrument = relationship("Instrument", back_populates="certificates")
    inspection = relationship("Inspection", back_populates="certificate")
