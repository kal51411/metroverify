import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AlertSeverityEnum(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    EXPIRED = "EXPIRED"

class AlertStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RENEWAL_SUBMITTED = "RENEWAL_SUBMITTED"

class ValidityAlert(Base):
    __tablename__ = "validity_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. ALT-2026-0001
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    certificate_id = Column(Integer, ForeignKey("verification_certificates.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Trader / Owner

    alert_type = Column(String(100), nullable=False) # EXPIRING_SOON_30D, EXPIRING_SOON_15D, EXPIRED, RE_VERIFICATION_DUE
    severity = Column(Enum(AlertSeverityEnum), default=AlertSeverityEnum.WARNING, nullable=False)
    status = Column(Enum(AlertStatusEnum), default=AlertStatusEnum.ACTIVE, nullable=False)

    days_remaining = Column(Integer, nullable=False) # Negative if already expired
    due_date = Column(DateTime, nullable=False)
    message = Column(Text, nullable=False)
    statutory_rule_ref = Column(String(200), default="Legal Metrology (General) Rules, 2011 - Rule 27", nullable=False)

    renewal_application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)

    # Relationships
    instrument = relationship("Instrument")
    certificate = relationship("VerificationCertificate")
    user = relationship("User")
    renewal_application = relationship("Application", foreign_keys=[renewal_application_id])
