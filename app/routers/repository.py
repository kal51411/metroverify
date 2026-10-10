from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List, Dict, Any
from datetime import datetime
import csv
import io

from app.database import get_db
from app.models.certificates import VerificationCertificate
from app.models.instruments import Instrument
from app.models.inspections import Inspection, SealRecord

router = APIRouter(prefix="/api/repository", tags=["repository"])

@router.get("/search")
def universal_repository_search(
    query: str = Query(..., min_length=1, description="Certificate ID, Serial Number, QR Token, Trader Name, or Model"),
    accuracy_class: Optional[str] = Query(None, description="CLASS_I, CLASS_II, CLASS_III, CLASS_IIII"),
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """
    Spotlight Universal Repository Search across all Legal Metrology instruments,
    stamping certificates, seal records, and cryptographic ledgers.
    """
    clean_q = query.strip()
    like_pat = f"%{clean_q}%"

    # Search Certificates
    cert_q = db.query(VerificationCertificate).options(
        joinedload(VerificationCertificate.instrument),
        joinedload(VerificationCertificate.inspection)
    ).join(Instrument, VerificationCertificate.instrument_id == Instrument.id).filter(
        or_(
            VerificationCertificate.certificate_id.ilike(like_pat),
            VerificationCertificate.certificate_number.ilike(like_pat),
            VerificationCertificate.qr_token.ilike(like_pat),
            VerificationCertificate.certificate_hash.ilike(like_pat),
            Instrument.serial_number.ilike(like_pat),
            Instrument.owner_name.ilike(like_pat),
            Instrument.business_name.ilike(like_pat),
            Instrument.model.ilike(like_pat),
            Instrument.manufacturer.ilike(like_pat)
        )
    )

    if accuracy_class and accuracy_class != "ALL":
        cert_q = cert_q.filter(Instrument.accuracy_class == accuracy_class)
    if district and district != "ALL":
        cert_q = cert_q.filter(Instrument.district.ilike(district))

    certs = cert_q.limit(limit).all()

    # Search Instruments
    inst_q = db.query(Instrument).filter(
        or_(
            Instrument.instrument_id.ilike(like_pat),
            Instrument.serial_number.ilike(like_pat),
            Instrument.owner_name.ilike(like_pat),
            Instrument.business_name.ilike(like_pat),
            Instrument.model.ilike(like_pat),
            Instrument.manufacturer.ilike(like_pat)
        )
    )
    if accuracy_class and accuracy_class != "ALL":
        inst_q = inst_q.filter(Instrument.accuracy_class == accuracy_class)
    if district and district != "ALL":
        inst_q = inst_q.filter(Instrument.district.ilike(district))

    instruments = inst_q.limit(limit).all()

    # Search Seals
    seals = db.query(SealRecord).filter(
        SealRecord.seal_number.ilike(like_pat)
    ).limit(10).all()

    now = datetime.utcnow()

    formatted_certs = []
    for c in certs:
        inst = c.instrument
        is_expired = c.valid_until < now
        formatted_certs.append({
            "id": c.id,
            "certificate_number": c.certificate_number,
            "certificate_id": c.certificate_id,
            "qr_token": c.qr_token,
            "verification_date": c.verification_date.strftime("%Y-%m-%d"),
            "valid_until": c.valid_until.strftime("%Y-%m-%d"),
            "is_valid": (c.status.value == "ACTIVE" if hasattr(c.status, "value") else c.status == "ACTIVE") and not is_expired,
            "status": "EXPIRED" if is_expired else (c.status.value if hasattr(c.status, "value") else str(c.status)),
            "officer_name": c.officer_name,
            "office_name": c.office_name,
            "certificate_hash": c.certificate_hash,
            "instrument": {
                "id": inst.id if inst else None,
                "serial_number": inst.serial_number if inst else "N/A",
                "manufacturer": inst.manufacturer if inst else "N/A",
                "model": inst.model if inst else "N/A",
                "accuracy_class": inst.accuracy_class.value if hasattr(inst.accuracy_class, "value") else str(inst.accuracy_class),
                "max_capacity": inst.max_capacity if inst else 0,
                "unit": inst.unit if inst else "kg",
                "owner_name": inst.owner_name if inst else "N/A",
                "business_name": inst.business_name if inst else "N/A",
                "district": inst.district if inst else "N/A"
            } if inst else None
        })

    formatted_instruments = []
    for i in instruments:
        formatted_instruments.append({
            "id": i.id,
            "instrument_id": i.instrument_id,
            "serial_number": i.serial_number,
            "manufacturer": i.manufacturer,
            "model": i.model,
            "accuracy_class": i.accuracy_class.value if hasattr(i.accuracy_class, "value") else str(i.accuracy_class),
            "max_capacity": i.max_capacity,
            "unit": i.unit,
            "owner_name": i.owner_name,
            "business_name": i.business_name,
            "district": i.district,
            "status": i.status.value if hasattr(i.status, "value") else str(i.status),
            "next_due_date": i.next_due_date.strftime("%Y-%m-%d") if i.next_due_date else None,
            "previous_certificate_id": i.previous_certificate_id
        })

    formatted_seals = []
    for s in seals:
        formatted_seals.append({
            "seal_number": s.seal_number,
            "seal_type": s.seal_type,
            "seal_location": s.seal_location,
            "applied_by": s.applied_by,
            "condition": s.condition,
            "tamper_status": s.tamper_status
        })

    return {
        "query": query,
        "match_count": len(formatted_certs) + len(formatted_instruments) + len(formatted_seals),
        "certificates": formatted_certs,
        "instruments": formatted_instruments,
        "seals": formatted_seals
    }

@router.get("/export")
def export_repository_records(format: str = Query("json", enum=["json", "csv"]), db: Session = Depends(get_db)):
    """
    Exports verification certificates ledger for regulatory scrutiny.
    """
    certs = db.query(VerificationCertificate).options(
        joinedload(VerificationCertificate.instrument)
    ).order_by(VerificationCertificate.id.desc()).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Certificate Number", "Serial Number", "Manufacturer", "Model",
            "Accuracy Class", "Max Capacity", "Unit", "Business Name",
            "District", "Verification Date", "Valid Until", "Status", "Hash"
        ])
        for c in certs:
            inst = c.instrument
            writer.writerow([
                c.certificate_number,
                inst.serial_number if inst else "",
                inst.manufacturer if inst else "",
                inst.model if inst else "",
                inst.accuracy_class.value if inst and hasattr(inst.accuracy_class, "value") else (inst.accuracy_class if inst else ""),
                inst.max_capacity if inst else "",
                inst.unit if inst else "",
                inst.business_name if inst else "",
                inst.district if inst else "",
                c.verification_date.strftime("%Y-%m-%d"),
                c.valid_until.strftime("%Y-%m-%d"),
                c.status.value if hasattr(c.status, "value") else str(c.status),
                c.certificate_hash
            ])
        output.seek(0)
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=metroverify_ledger.csv"})

    records = []
    for c in certs:
        inst = c.instrument
        records.append({
            "certificate_number": c.certificate_number,
            "serial_number": inst.serial_number if inst else None,
            "business_name": inst.business_name if inst else None,
            "district": inst.district if inst else None,
            "verification_date": c.verification_date.strftime("%Y-%m-%d"),
            "valid_until": c.valid_until.strftime("%Y-%m-%d"),
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
            "hash": c.certificate_hash
        })
    return {"total_records": len(records), "records": records}
