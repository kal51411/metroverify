from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.instruments import Instrument, InstrumentStatusEnum, AccuracyClassEnum
from app.models.jurisdictions import Jurisdiction
from app.schemas.instruments import InstrumentCreate, InstrumentOut
from app.rules.test_plan_generator import generate_load_test_plan
from app.rules.fees import calculate_verification_fee
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/instruments", tags=["instruments"])

@router.get("", response_model=List[InstrumentOut])
def list_instruments(
    status: Optional[str] = None,
    accuracy_class: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Instrument)
    if status and status != "ALL":
        q = q.filter(Instrument.status == status)
    if accuracy_class and accuracy_class != "ALL":
        q = q.filter(Instrument.accuracy_class == accuracy_class)
    if district and district != "ALL":
        q = q.filter(Instrument.district == district)
    return [InstrumentOut.model_validate(i) for i in q.order_by(Instrument.created_at.desc()).all()]

@router.get("/{instrument_id}", response_model=InstrumentOut)
def get_instrument(instrument_id: int, db: Session = Depends(get_db)):
    inst = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return InstrumentOut.model_validate(inst)

@router.post("", response_model=InstrumentOut)
def create_instrument(payload: InstrumentCreate, db: Session = Depends(get_db)):
    existing = db.query(Instrument).filter(Instrument.serial_number == payload.serial_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial number is already registered in MetroVerify.")
        
    count = db.query(Instrument).count() + 1001
    inst_id = f"LM-INST-{count}"
    
    # Check jurisdiction
    jur = db.query(Jurisdiction).filter(Jurisdiction.district.ilike(payload.district.strip())).first()
    jur_id = jur.id if jur else None
    
    inst = Instrument(
        instrument_id=inst_id,
        instrument_type=payload.instrument_type,
        manufacturer=payload.manufacturer,
        model=payload.model,
        serial_number=payload.serial_number,
        model_approval_number=payload.model_approval_number,
        accuracy_class=payload.accuracy_class,
        max_capacity=payload.max_capacity,
        min_capacity=payload.min_capacity,
        verification_scale_interval_e=payload.verification_scale_interval_e,
        actual_scale_interval_d=payload.actual_scale_interval_d,
        unit=payload.unit,
        installation_location=payload.installation_location,
        owner_name=payload.owner_name,
        business_name=payload.business_name,
        address=payload.address,
        district=payload.district,
        division=payload.division,
        jurisdiction_id=jur_id,
        status=InstrumentStatusEnum.UNVERIFIED,
        seal_configuration=payload.seal_configuration,
        verification_mark_location=payload.verification_mark_location
    )
    db.add(inst)
    db.flush()
    
    AuditService.log_event(
        db=db,
        action="INSTRUMENT_REGISTERED",
        entity_type="Instrument",
        entity_id=inst_id,
        new_value={"serial": inst.serial_number, "max": inst.max_capacity, "e": inst.verification_scale_interval_e}
    )
    
    db.commit()
    db.refresh(inst)
    return InstrumentOut.model_validate(inst)

@router.get("/{instrument_id}/test-plan")
def get_instrument_test_plan(instrument_id: int, db: Session = Depends(get_db)):
    inst = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
        
    plan = generate_load_test_plan(
        min_capacity=inst.min_capacity,
        max_capacity=inst.max_capacity,
        e=inst.verification_scale_interval_e,
        accuracy_class=inst.accuracy_class,
        unit=inst.unit
    )
    return {
        "instrument_id": inst.instrument_id,
        "accuracy_class": inst.accuracy_class.value,
        "max_capacity": inst.max_capacity,
        "min_capacity": inst.min_capacity,
        "e": inst.verification_scale_interval_e,
        "d": inst.actual_scale_interval_d,
        "unit": inst.unit,
        "test_steps": plan
    }

@router.get("/{instrument_id}/fee-estimate")
def get_fee_estimate(instrument_id: int, is_premises: bool = False, db: Session = Depends(get_db)):
    inst = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
        
    fee_info = calculate_verification_fee(
        instrument_type=inst.instrument_type,
        capacity=inst.max_capacity,
        is_premises_verification=is_premises
    )
    return fee_info
