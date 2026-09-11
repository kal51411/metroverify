
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import shutil
from database import get_db
from models import Instrument, Application
from schemas import InstrumentCreate, InstrumentOut, ApplicationOut
from datetime import datetime
router = APIRouter(prefix="/api/instruments", tags=["instruments"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
instrument_counter = [1001]
def generate_instrument_id(db: Session):
    count = db.query(Instrument).count()
    return f"LM-INST-{1001 + count}"
@router.get("", response_model=list[InstrumentOut])
def get_instruments(db: Session = Depends(get_db)):
    return db.query(Instrument).order_by(Instrument.created_at.desc()).all()
@router.get("/{instrument_id}", response_model=InstrumentOut)
def get_instrument(instrument_id: int, db: Session = Depends(get_db)):
    inst = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return inst
@router.post("", response_model=dict)
async def create_instrument(
    type: str = Form(...),
    manufacturer: str = Form(...),
    model: str = Form(...),
    serial_number: str = Form(...),
    capacity: float = Form(...),
    unit: str = Form(...),
    owner_name: str = Form(...),
    business_name: str = Form(...),
    address: str = Form(...),
    notes: Optional[str] = Form(None),
    document: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # Check for duplicate serial
    existing = db.query(Instrument).filter(Instrument.serial_number == serial_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already registered")
    instrument_id = generate_instrument_id(db)