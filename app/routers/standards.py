from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.standards import StandardAsset, AssetStatusEnum
from app.schemas.standards import StandardAssetCreate, StandardAssetOut
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/standards", tags=["standards"])

@router.get("", response_model=List[StandardAssetOut])
def list_standard_assets(
    status: Optional[str] = None,
    accuracy_class: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(StandardAsset)
    if status and status != "ALL":
        q = q.filter(StandardAsset.status == status)
    if accuracy_class and accuracy_class != "ALL":
        q = q.filter(StandardAsset.accuracy_class == accuracy_class)
    return [StandardAssetOut.model_validate(a) for a in q.order_by(StandardAsset.nominal_mass.asc()).all()]

@router.get("/{asset_id}", response_model=StandardAssetOut)
def get_standard_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(StandardAsset).filter(StandardAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Standard asset not found")
    return StandardAssetOut.model_validate(asset)

@router.post("", response_model=StandardAssetOut)
def create_standard_asset(payload: StandardAssetCreate, db: Session = Depends(get_db)):
    existing = db.query(StandardAsset).filter(
        (StandardAsset.standard_asset_id == payload.standard_asset_id) |
        (StandardAsset.asset_tag == payload.asset_tag)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Standard asset ID or asset tag already registered")
        
    asset = StandardAsset(**payload.model_dump())
    db.add(asset)
    db.flush()
    
    AuditService.log_event(
        db=db,
        action="STANDARD_ASSET_REGISTERED",
        entity_type="StandardAsset",
        entity_id=asset.standard_asset_id,
        user_role="ADMIN",
        new_value={"mass": asset.nominal_mass, "class": asset.accuracy_class, "valid_until": str(asset.valid_until)}
    )
    
    db.commit()
    db.refresh(asset)
    return StandardAssetOut.model_validate(asset)
