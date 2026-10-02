import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AccuracyClassEnum(str, enum.Enum):
    CLASS_I = "CLASS_I"      # Special Accuracy
    CLASS_II = "CLASS_II"    # High Accuracy
    CLASS_III = "CLASS_III"  # Medium Accuracy
    CLASS_IIII = "CLASS_IIII"# Ordinary Accuracy

class InstrumentStatusEnum(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REQUIRES_REVERIFICATION = "REQUIRES_REVERIFICATION"
    REJECTED = "REJECTED"

class Instrument(Base):
    __tablename__ = "instruments"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String(100), unique=True, index=True, nullable=False)
    instrument_type = Column(String(100), nullable=False) # e.g., NON_AUTOMATIC_WEIGHING_INSTRUMENT, WEIGHBRIDGE, PLATFORM_SCALE, COUNTER_MACHINE
    manufacturer = Column(String(200), nullable=False)
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    model_approval_number = Column(String(100), nullable=True)
    
    accuracy_class = Column(Enum(AccuracyClassEnum), default=AccuracyClassEnum.CLASS_III, nullable=False)
    max_capacity = Column(Float, nullable=False) # Max
    min_capacity = Column(Float, nullable=False) # Min
    verification_scale_interval_e = Column(Float, nullable=False) # e
    actual_scale_interval_d = Column(Float, nullable=False) # d
    unit = Column(String(20), default="kg", nullable=False)
    
    installation_location = Column(Text, nullable=True)
    owner_name = Column(String(200), nullable=False)
    business_name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    district = Column(String(100), nullable=False, index=True)
    division = Column(String(100), nullable=False, index=True)
    jurisdiction_id = Column(Integer, ForeignKey("jurisdictions.id"), nullable=True)
    
    status = Column(Enum(InstrumentStatusEnum), default=InstrumentStatusEnum.UNVERIFIED, nullable=False)
    last_verification_date = Column(DateTime, nullable=True)
    next_due_date = Column(DateTime, nullable=True)
    previous_certificate_id = Column(String(100), nullable=True)
    
    seal_configuration = Column(Text, nullable=True) # JSON or text description of sealing points
    verification_mark_location = Column(String(255), nullable=True) # Location of stamp/mark
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    jurisdiction = relationship("Jurisdiction", back_populates="instruments")
    applications = relationship("Application", back_populates="instrument")
    inspections = relationship("Inspection", back_populates="instrument")
    certificates = relationship("VerificationCertificate", back_populates="instrument")
