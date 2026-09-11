from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ---- Instrument ----

class InstrumentCreate(BaseModel):
    type: str
    manufacturer: str
    model: str
    serial_number: str
    capacity: float
    unit: str
    owner_name: str
    business_name: str
    address: str


class InstrumentOut(BaseModel):
    id: int
    instrument_id: str
    type: str
    manufacturer: str
    model: str
    serial_number: str
    capacity: float
    unit: str
    owner_name: str
    business_name: str
    address: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Application ----

class ApplicationCreate(BaseModel):
    instrument_id: int
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: int
    application_id: str
    instrument_id: int
    status: str
    submitted_at: datetime
    inspection_date: Optional[str] = None
    inspection_time: Optional[str] = None
    test_centre: Optional[str] = None
    assigned_officer: Optional[str] = None
    priority: str
    notes: Optional[str] = None
    document_path: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    instrument: Optional[InstrumentOut] = None
    certificate: Optional['CertificateOut'] = None

    class Config:
        from_attributes = True


class ScheduleRequest(BaseModel):
    inspection_date: str
    inspection_time: str
    test_centre: str
    officer: str


class RejectRequest(BaseModel):
    notes: Optional[str] = None


# ---- Inspection ----

class InspectionResultCreate(BaseModel):
    standard_value: float
    observed_value: float


class InspectionResultOut(BaseModel):
    id: int
    standard_value: float
    observed_value: float
    error: float
    error_percentage: float
    within_tolerance: bool

    class Config:
        from_attributes = True


class InspectionCreate(BaseModel):
    officer: str
    tolerance: float = 0.5
    results: List[InspectionResultCreate]


class InspectionOut(BaseModel):
    id: int
    inspection_id: str
    application_id: int
    officer: str
    tolerance: float
    result: Optional[str] = None
    max_error_percentage: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: List[InspectionResultOut] = []

    class Config:
        from_attributes = True


# ---- Certificate ----

class CertificateOut(BaseModel):
    id: int
    certificate_id: str
    instrument_id: int
    application_id: int
    verification_date: datetime
    valid_until: datetime
    result: str
    qr_token: str
    officer: str
    test_centre: str
    created_at: datetime
    instrument: Optional[InstrumentOut] = None

    class Config:
        from_attributes = True


# ---- Public Verify ----

class VerifyResponse(BaseModel):
    certificate_id: str
    instrument_id: str
    instrument_type: str
    manufacturer: str
    model: str
    serial_number: str
    owner_name: str
    business_name: str
    verification_date: datetime
    valid_until: datetime
    result: str
    officer: str
    test_centre: str
    is_valid: bool
    is_expired: bool
    status_label: str


# ---- Dashboard Stats ----

class BusinessStats(BaseModel):
    total_instruments: int
    total_applications: int
    under_verification: int
    verified: int
    expiring_soon: int


class OfficerStats(BaseModel):
    pending: int
    scheduled: int
    under_inspection: int
    verified: int
    failed: int
    expiring_soon: int


ApplicationOut.model_rebuild()
