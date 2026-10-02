from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.instruments import AccuracyClassEnum, InstrumentStatusEnum

class InstrumentBase(BaseModel):
    instrument_type: str = Field(..., example="NON_AUTOMATIC_WEIGHING_INSTRUMENT")
    manufacturer: str = Field(..., example="DemoScale India Pvt Ltd")
    model: str = Field(..., example="DS-150P")
    serial_number: str = Field(..., example="DS-2026-9812")
    model_approval_number: Optional[str] = Field(None, example="IND/09/2024/412")
    
    accuracy_class: AccuracyClassEnum = AccuracyClassEnum.CLASS_III
    max_capacity: float = Field(..., gt=0, example=150.0)
    min_capacity: float = Field(..., ge=0, example=1.0)
    verification_scale_interval_e: float = Field(..., gt=0, example=0.05)
    actual_scale_interval_d: float = Field(..., gt=0, example=0.01)
    unit: str = Field("kg", example="kg")
    
    installation_location: Optional[str] = None
    owner_name: str
    business_name: str
    address: str
    district: str
    division: str
    jurisdiction_id: Optional[int] = None
    seal_configuration: Optional[str] = None
    verification_mark_location: Optional[str] = None

class InstrumentCreate(InstrumentBase):
    pass

class InstrumentOut(InstrumentBase):
    id: int
    instrument_id: str
    status: InstrumentStatusEnum
    last_verification_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    previous_certificate_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
