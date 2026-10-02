import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class TestTemplate(Base):
    __tablename__ = "test_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_code = Column(String(100), unique=True, index=True, nullable=False) # e.g. NAWI_CLASS_III_ROUTINE
    name = Column(String(255), nullable=False)
    instrument_type = Column(String(100), nullable=False)
    accuracy_class = Column(String(50), nullable=False)
    version = Column(String(50), default="2026.1", nullable=False)
    steps_config = Column(Text, nullable=False) # JSON array of test step definitions
    source_rule_reference = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("test_templates.id"), nullable=True)
    ruleset_version = Column(String(100), nullable=False)
    
    status = Column(String(50), default="IN_PROGRESS", nullable=False) # IN_PROGRESS, PASSED, FAILED, ABORTED
    
    # Detailed module statuses
    visual_inspection_status = Column(String(50), default="PENDING") # PASS, FAIL, PENDING
    zero_test_status = Column(String(50), default="PENDING")
    indication_test_status = Column(String(50), default="PENDING")
    repeatability_test_status = Column(String(50), default="PENDING")
    eccentricity_test_status = Column(String(50), default="PENDING")
    discrimination_test_status = Column(String(50), default="PENDING")
    tare_test_status = Column(String(50), default="NOT_APPLICABLE")
    zero_return_status = Column(String(50), default="PENDING")
    high_capacity_substitution_status = Column(String(50), default="NOT_APPLICABLE") # NOT_APPLICABLE, NOT_ELIGIBLE, ELIGIBLE_ONE_THIRD, ELIGIBLE_ONE_FIFTH
    
    final_result = Column(String(50), nullable=True) # PASS, FAIL
    decision_summary = Column(Text, nullable=True) # Deterministic explanation of PASS or failure cause
    
    # Environment conditions
    ambient_temperature_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    barometric_pressure_hpa = Column(Float, nullable=True)
    test_location = Column(String(255), nullable=True)
    
    # Standard Assets Used
    standard_asset_ids = Column(Text, nullable=True) # JSON list of standard_asset_ids verified
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    application = relationship("Application", back_populates="inspection")
    instrument = relationship("Instrument", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id], back_populates="assigned_inspections")
    template = relationship("TestTemplate")
    
    steps = relationship("InspectionTestStep", back_populates="inspection", cascade="all, delete-orphan", order_by="InspectionTestStep.step_order")
    measurements = relationship("TestMeasurement", back_populates="inspection", cascade="all, delete-orphan")
    seals = relationship("SealRecord", back_populates="inspection", cascade="all, delete-orphan")
    evidences = relationship("InspectionEvidence", back_populates="inspection", cascade="all, delete-orphan")
    certificate = relationship("VerificationCertificate", back_populates="inspection", uselist=False)

class InspectionTestStep(Base):
    __tablename__ = "inspection_test_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    step_key = Column(String(100), nullable=False) # visual_inspection, zero_test, indication_error, repeatability, eccentricity, discrimination, tare, zero_return, high_capacity_substitution
    step_name = Column(String(255), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, PASSED, FAILED, SKIPPED, NOT_APPLICABLE
    raw_input_json = Column(Text, nullable=True) # Exact raw input captured from operator
    computed_result_json = Column(Text, nullable=True) # Result, error, mpe, repeatability error, etc.
    failure_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="steps")

class TestMeasurement(Base):
    __tablename__ = "test_measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    step_key = Column(String(100), nullable=False)
    load_target = Column(Float, nullable=False)
    standard_value = Column(Float, nullable=False)
    observed_value = Column(Float, nullable=False)
    error = Column(Float, nullable=False) # observed - standard
    error_percentage = Column(Float, nullable=False)
    verification_interval_count = Column(Float, nullable=False) # m / e
    mpe = Column(Float, nullable=False) # maximum permissible error in engineering units (kg/g)
    within_mpe = Column(Boolean, nullable=False)
    run_index = Column(Integer, default=1)
    position = Column(String(100), nullable=True) # CENTER, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, etc.
    
    # Audit & Versioning of raw data
    is_accepted = Column(Boolean, default=True)
    correction_reason = Column(Text, nullable=True)
    corrected_by = Column(String(150), nullable=True)
    original_measurement_id = Column(Integer, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="measurements")

class SealRecord(Base):
    __tablename__ = "seal_records"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    seal_number = Column(String(100), nullable=False)
    seal_type = Column(String(100), nullable=False) # LEAD_SEAL, WIRE_SECURITY_SEAL, TAMPER_EVIDENT_LABEL
    seal_location = Column(String(255), nullable=False) # CALIBRATION_PORT, JUNCTION_BOX, ENCLOSURE_SCREW
    verification_mark_location = Column(String(255), nullable=False)
    applied_by = Column(String(150), nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow)
    condition = Column(String(100), default="INTACT", nullable=False)
    tamper_status = Column(String(100), default="SECURE", nullable=False)
    
    inspection = relationship("Inspection", back_populates="seals")

class InspectionEvidence(Base):
    __tablename__ = "inspection_evidences"
    
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    step_key = Column(String(100), nullable=True)
    evidence_type = Column(String(100), nullable=False) # NAMEPLATE, SERIAL_NUMBER, DISPLAY, SEAL, VERIFICATION_MARK, TEST_SETUP, STANDARD_WEIGHT, DEFECT
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(100), nullable=False) # SHA-256
    caption = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    captured_by = Column(String(150), nullable=False)
    
    inspection = relationship("Inspection", back_populates="evidences")
