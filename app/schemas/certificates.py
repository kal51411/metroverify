from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.certificates import CertificateStatusEnum
from app.schemas.instruments import InstrumentOut

class CertificateOut(BaseModel):
    id: int
    certificate_id: str
    certificate_number: str
    application_id: int
    instrument_id: int
    inspection_id: int
    
    verification_date: datetime
    valid_until: datetime
    interval_months: int
    result: str
    officer_name: str
    officer_designation: str
    office_name: str
    test_location: str
    fee_reference: Optional[str] = None
    previous_certificate_number: Optional[str] = None
    ruleset_version: str
    certificate_version: str
    qr_token: str
    certificate_hash: str
    status: CertificateStatusEnum
    created_at: datetime
    
    instrument: Optional[InstrumentOut] = None

    class Config:
        from_attributes = True

class CertificateVerifyResponse(BaseModel):
    is_valid: bool
    status: str # VALID, EXPIRED, SUSPENDED, REVOKED, NOT_FOUND
    status_label: str
    certificate_id: str
    certificate_number: str
    instrument_id: str
    instrument_type: str
    manufacturer: str
    model: str
    serial_number: str
    accuracy_class: str
    max_capacity: float
    verification_scale_interval_e: float
    unit: str
    owner_name: str
    business_name: str
    address: str
    verification_date: datetime
    valid_until: datetime
    interval_months: int
    result: str
    officer_name: str
    office_name: str
    test_location: str
    ruleset_version: str
    certificate_hash: str
    hash_verified: bool
    is_demo: bool = False
    disclaimer: str
