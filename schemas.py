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
