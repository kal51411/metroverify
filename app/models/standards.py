import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, Boolean
from app.database import Base

class StandardHierarchyEnum(str, enum.Enum):
    INTERNATIONAL_REFERENCE = "INTERNATIONAL_REFERENCE"
    NATIONAL_STANDARD = "NATIONAL_STANDARD"
    REGIONAL_STANDARD = "REGIONAL_STANDARD"
    SECONDARY_STANDARD = "SECONDARY_STANDARD"
    WORKING_STANDARD = "WORKING_STANDARD"

class AssetStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    QUARANTINED = "QUARANTINED"
    IN_CALIBRATION = "IN_CALIBRATION"
    RETIRED = "RETIRED"

class StandardAsset(Base):
    __tablename__ = "standard_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    standard_asset_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. STD-M1-20KG-001
    asset_tag = Column(String(100), unique=True, index=True, nullable=False)
    nominal_mass = Column(Float, nullable=False)
    unit = Column(String(20), default="kg", nullable=False)
    accuracy_class = Column(String(20), nullable=False) # E1, E2, F1, F2, M1, M2, M3
    
    certificate_number = Column(String(100), nullable=False)
    calibration_date = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    laboratory = Column(String(255), nullable=False) # e.g. Regional Reference Standard Laboratory / NPL
    traceability_reference = Column(String(255), nullable=False)
    hierarchy_level = Column(Enum(StandardHierarchyEnum), default=StandardHierarchyEnum.WORKING_STANDARD, nullable=False)
    
    current_location = Column(String(255), nullable=False)
    status = Column(Enum(AssetStatusEnum), default=AssetStatusEnum.ACTIVE, nullable=False)
    condition = Column(String(100), default="EXCELLENT", nullable=False)
    serial_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
