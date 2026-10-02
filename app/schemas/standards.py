from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.standards import StandardHierarchyEnum, AssetStatusEnum

class StandardAssetBase(BaseModel):
    standard_asset_id: str
    asset_tag: str
    nominal_mass: float
    unit: str = "kg"
    accuracy_class: str
    certificate_number: str
    calibration_date: datetime
    valid_until: datetime
    laboratory: str
    traceability_reference: str
    hierarchy_level: StandardHierarchyEnum = StandardHierarchyEnum.WORKING_STANDARD
    current_location: str
    status: AssetStatusEnum = AssetStatusEnum.ACTIVE
    condition: str = "EXCELLENT"
    serial_number: Optional[str] = None
    notes: Optional[str] = None

class StandardAssetCreate(StandardAssetBase):
    pass

class StandardAssetOut(StandardAssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
