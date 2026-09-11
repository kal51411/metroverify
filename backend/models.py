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
    district = Column(String, default="Pune")
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="instrument")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String, unique=True, index=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    application_type = Column(String, default="VERIFICATION")  # VERIFICATION, RE_VERIFICATION
    status = Column(String, default="SUBMITTED")  # DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SCHEDULED, UNDER_INSPECTION, VERIFIED, FAILED, EXPIRED
    submitted_at = Column(DateTime, default=datetime.utcnow)
    inspection_date = Column(String, nullable=True)
    inspection_time = Column(String, nullable=True)
    test_centre = Column(String, nullable=True)
    assigned_officer = Column(String, nullable=True)
    allocated_to_type = Column(String, default="LMO")  # LMO, GATC
    gatc_name = Column(String, nullable=True)
    district = Column(String, default="Pune")
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
    stamping_seal_no = Column(String, nullable=True)
    gps_location = Column(String, nullable=True)
    instrument_photo = Column(String, nullable=True)
    seal_photo = Column(String, nullable=True)
    is_field_inspection = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="inspection")
    results = relationship("InspectionResult", back_populates="inspection")


class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    standard_value = Column(Float)
    observed_value = Column(Float)
    error = Column(Float)
    error_percentage = Column(Float)
    within_tolerance = Column(Boolean)

    inspection = relationship("Inspection", back_populates="results")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, unique=True, index=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    verification_date = Column(DateTime)
    valid_until = Column(DateTime)
    result = Column(String)
    qr_token = Column(String, unique=True)
    officer = Column(String)
    test_centre = Column(String)
    allocated_to_type = Column(String, default="LMO")  # LMO, GATC
    verification_type = Column(String, default="VERIFICATION")
    stamping_seal_no = Column(String, nullable=True)
    district = Column(String, default="Pune")
    created_at = Column(DateTime, default=datetime.utcnow)

    instrument = relationship("Instrument")
    application = relationship("Application", back_populates="certificate")
