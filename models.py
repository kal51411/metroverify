from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
class Instrument(Base):
    __tablename__ = "instruments"
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String, unique=True, index=True)
    type = Column(String)
    manufacturer = Column(String)
    model = Column(String)
    serial_number = Column(String, unique=True, index=True)
    capacity = Column(Float)
    unit = Column(String)
    owner_name = Column(String)
    business_name = Column(String)
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    applications = relationship("Application", back_populates="instrument")
class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, unique=True, index=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    status = Column(String, default="SUBMITTED")  # DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SCHEDULED, UNDER_INSPECTION, VERIFIED, FAILED, EXPIRED
    submitted_at = Column(DateTime, default=datetime.utcnow)
    inspection_date = Column(String, nullable=True)
    inspection_time = Column(String, nullable=True)
    test_centre = Column(String, nullable=True)
    assigned_officer = Column(String, nullable=True)
    priority = Column(String, default="NORMAL")  # LOW, NORMAL, HIGH
    notes = Column(Text, nullable=True)
    document_path = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    instrument = relationship("Instrument", back_populates="applications")
    inspection = relationship("Inspection", back_populates="application", uselist=False)
    certificate = relationship("Certificate", back_populates="application", uselist=False)
class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String, unique=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    officer = Column(String)
    tolerance = Column(Float, default=0.5)
    result = Column(String, nullable=True)  # PASS, FAIL
    max_error_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)