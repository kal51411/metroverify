from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.applications import (
    ApplicationStatusEnum, ApplicationTypeEnum, JurisdictionStatusEnum,
    DocumentStatusEnum, DocumentTypeEnum
)
from app.schemas.instruments import InstrumentOut

class DocumentOut(BaseModel):
    id: int
    document_id: str
    document_type: DocumentTypeEnum
    title: str
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    status: DocumentStatusEnum
    rejection_reason: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentOut(BaseModel):
    id: int
    payment_id: str
    challan_number: str
    gras_grn: Optional[str] = None
    scroll_number: Optional[str] = None
    amount: float
    payment_date: datetime
    payment_status: str
    fee_breakdown: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QueryOut(BaseModel):
    id: int
    query_id: str
    query_text: str
    raised_by: str
    raised_at: datetime
    status: str
    response_text: Optional[str] = None
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    instrument_id: int
    application_type: ApplicationTypeEnum = ApplicationTypeEnum.NEW_VERIFICATION
    is_premises_verification: bool = False
    advance_notice_days: int = 30
    priority: str = "NORMAL"
    notes: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    application_id: str
    instrument_id: int
    applicant_id: int
    application_type: ApplicationTypeEnum
    status: ApplicationStatusEnum
    is_premises_verification: bool
    advance_notice_days: int
    
    jurisdiction_status: JurisdictionStatusEnum
    jurisdiction_notes: Optional[str] = None
    
    assigned_inspector_id: Optional[int] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    test_centre_or_premises: Optional[str] = None
    priority: str
    notes: Optional[str] = None
    
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    instrument: Optional[InstrumentOut] = None
    documents: List[DocumentOut] = []
    payments: List[PaymentOut] = []
    queries: List[QueryOut] = []

    class Config:
        from_attributes = True

class ScheduleRequest(BaseModel):
    scheduled_date: str
    scheduled_time: str
    test_centre_or_premises: str
    inspector_id: int
    notes: Optional[str] = None

class RejectRequest(BaseModel):
    reason: str

class QueryCreateRequest(BaseModel):
    query_text: str

class QueryRespondRequest(BaseModel):
    response_text: str

class PaymentCreateRequest(BaseModel):
    challan_number: str
    gras_grn: Optional[str] = None
    scroll_number: Optional[str] = None
    amount: float
