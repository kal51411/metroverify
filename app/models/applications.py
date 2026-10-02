import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    QUERY_RAISED = "QUERY_RAISED"
    QUERY_RESPONDED = "QUERY_RESPONDED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SCHEDULED = "SCHEDULED"
    UNDER_INSPECTION = "UNDER_INSPECTION"
    INSPECTION_PASSED = "INSPECTION_PASSED"
    INSPECTION_FAILED = "INSPECTION_FAILED"
    CERTIFICATE_PENDING = "CERTIFICATE_PENDING"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REQUIRES_REVERIFICATION = "REQUIRES_REVERIFICATION"
    CANCELLED = "CANCELLED"

class ApplicationTypeEnum(str, enum.Enum):
    NEW_VERIFICATION = "NEW_VERIFICATION"
    RE_VERIFICATION = "RE_VERIFICATION"
    PREMISES_VERIFICATION = "PREMISES_VERIFICATION"

class JurisdictionStatusEnum(str, enum.Enum):
    VALID_JURISDICTION = "VALID_JURISDICTION"
    WRONG_JURISDICTION = "WRONG_JURISDICTION"
    REFERRED = "REFERRED"
    REJECTED = "REJECTED"

class DocumentStatusEnum(str, enum.Enum):
    MISSING = "MISSING"
    UPLOADED = "UPLOADED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class DocumentTypeEnum(str, enum.Enum):
    PURCHASE_BILL = "PURCHASE_BILL"
    MODEL_APPROVAL_CERTIFICATE = "MODEL_APPROVAL_CERTIFICATE"
    AUDIT_REPORT = "AUDIT_REPORT"
    NOC = "NOC"
    PREVIOUS_CERTIFICATE = "PREVIOUS_CERTIFICATE"
    GRAS_CHALLAN = "GRAS_CHALLAN"
    OTHER = "OTHER"

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(100), unique=True, index=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    application_type = Column(Enum(ApplicationTypeEnum), default=ApplicationTypeEnum.NEW_VERIFICATION, nullable=False)
    status = Column(Enum(ApplicationStatusEnum), default=ApplicationStatusEnum.SUBMITTED, nullable=False, index=True)
    
    # Premises verification flag & advance notice (e.g. 30 days rule in Maharashtra)
    is_premises_verification = Column(Boolean, default=False)
    advance_notice_days = Column(Integer, default=30)
    
    # Jurisdiction scrutiny
    jurisdiction_id = Column(Integer, ForeignKey("jurisdictions.id"), nullable=True)
    jurisdiction_status = Column(Enum(JurisdictionStatusEnum), default=JurisdictionStatusEnum.VALID_JURISDICTION, nullable=False)
    jurisdiction_notes = Column(Text, nullable=True)
    
    # Scheduling & Inspector Assignment
    assigned_inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    scheduled_date = Column(String(50), nullable=True)
    scheduled_time = Column(String(50), nullable=True)
    test_centre_or_premises = Column(String(255), nullable=True)
    priority = Column(String(20), default="NORMAL") # LOW, NORMAL, HIGH, URGENT
    
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    instrument = relationship("Instrument", back_populates="applications")
    applicant = relationship("User", foreign_keys=[applicant_id], back_populates="applications")
    jurisdiction = relationship("Jurisdiction", back_populates="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="application", cascade="all, delete-orphan")
    queries = relationship("QueryRecord", back_populates="application", cascade="all, delete-orphan")
    inspection = relationship("Inspection", back_populates="application", uselist=False)
    certificate = relationship("VerificationCertificate", back_populates="application", uselist=False)

class ApplicationDocument(Base):
    __tablename__ = "application_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    document_type = Column(Enum(DocumentTypeEnum), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.UPLOADED, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(150), nullable=True)
    
    application = relationship("Application", back_populates="documents")

class PaymentRecord(Base):
    __tablename__ = "payment_records"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    challan_number = Column(String(100), nullable=False)
    gras_grn = Column(String(100), nullable=True) # Maharashtra Government Receipt Accounting System GRN
    scroll_number = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False) # INR
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String(50), default="VERIFIED", nullable=False) # PENDING, VERIFIED, FAILED
    fee_breakdown = Column(Text, nullable=True) # JSON details: base_fee, premises_fee, cess, etc.
    verified_by = Column(String(150), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    application = relationship("Application", back_populates="payments")

class QueryRecord(Base):
    __tablename__ = "query_records"
    
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    query_text = Column(Text, nullable=False)
    raised_by = Column(String(150), nullable=False)
    raised_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, RESOLVED
    response_text = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    
    application = relationship("Application", back_populates="queries")
