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

UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
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

    instrument = Instrument(
        instrument_id=instrument_id,
        type=type,
        manufacturer=manufacturer,
        model=model,
        serial_number=serial_number,
        capacity=capacity,
        unit=unit,
        owner_name=owner_name,
        business_name=business_name,
        address=address,
    )
    db.add(instrument)
    db.flush()

    # Handle file upload
    doc_path = None
    if document and document.filename:
        filename = f"{instrument_id}_{uuid.uuid4().hex[:8]}_{document.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(document.file, f)
        doc_path = filepath

    # Create application
    app_count = db.query(Application).count()
    year = datetime.utcnow().year
    application_id = f"LM-APP-{year}-{str(app_count + 1).zfill(3)}"

    application = Application(
        application_id=application_id,
        instrument_id=instrument.id,
        status="SUBMITTED",
        document_path=doc_path,
        notes=notes,
    )
    db.add(application)
    db.commit()
    db.refresh(instrument)
    db.refresh(application)

    return {
        "instrument_id": instrument.id,
        "instrument_ref": instrument.instrument_id,
        "application_id": application.id,
        "application_ref": application.application_id,
        "message": "Instrument registered and application submitted successfully",
    }
