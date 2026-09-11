"""
Auto-seed script for MetroVerify prototype.
Creates realistic sample data for demonstration purposes.
"""

from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Instrument, Application, Inspection, InspectionResult, Certificate


def get_expiry_status(valid_until: datetime) -> str:
    diff = (valid_until - datetime.utcnow()).days
    if diff < 0:
        return "EXPIRED"
    elif diff < 30:
        return "EXPIRING"
    elif diff < 90:
        return "EXPIRING_SOON"
    return "ACTIVE"


INSTRUMENTS_DATA = [
    {
        "instrument_id": "LM-INST-1001",
        "type": "Electronic Weighing Scale",
        "manufacturer": "Essae Teraoka",
        "model": "ER-315",
        "serial_number": "ET-ER315-2024-001",
        "capacity": 150.0,
        "unit": "kg",
        "owner_name": "Rajesh Sharma",
        "business_name": "Sharma Weighing Services",
        "address": "Shop No. 12, Market Yard, Pune, Maharashtra - 411037",
    },
    {
        "instrument_id": "LM-INST-1002",
        "type": "Platform Weighing Machine",
        "manufacturer": "Mettler Toledo",
        "model": "BBA462",
        "serial_number": "MT-BBA462-2024-002",
        "capacity": 500.0,
        "unit": "kg",
        "owner_name": "Suresh Patil",
        "business_name": "Mumbai Fresh Mart",
        "address": "Plot 45, APMC Market, Vashi, Navi Mumbai, Maharashtra - 400703",
    },
    {
        "instrument_id": "LM-INST-1003",
        "type": "Fuel Dispenser",
        "manufacturer": "Tokheim",
        "model": "Premier B",
        "serial_number": "TK-PRMB-2024-003",
        "capacity": 999.99,
        "unit": "litre",
        "owner_name": "Anil Kumar",
        "business_name": "Metro Fuel Services",
        "address": "NH-48, Khopoli Bypass, Raigad, Maharashtra - 410203",
    },
    {
        "instrument_id": "LM-INST-1004",
        "type": "Weighbridge",
        "manufacturer": "Avery Weigh-Tronix",
        "model": "ZM305",
        "serial_number": "AW-ZM305-2024-004",
        "capacity": 60000.0,
        "unit": "kg",
        "owner_name": "Vijay Desai",
        "business_name": "Patil Industries Pvt Ltd",
        "address": "MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026",
    },
    {
        "instrument_id": "LM-INST-1005",
        "type": "Electronic Weighing Scale",
        "manufacturer": "Sartorius",
        "model": "CPA34001",
        "serial_number": "SA-CPA34-2024-005",
        "capacity": 34.0,
        "unit": "kg",
        "owner_name": "Priya Nair",
        "business_name": "ABC Retail Stores",
        "address": "15, Linking Road, Bandra West, Mumbai, Maharashtra - 400050",
    },
]

APPLICATIONS_DATA = [
    # Verified (PASS) — cert already issued
    {"status": "VERIFIED", "instrument_idx": 0, "days_ago": 45, "officer": "Smt. Kavitha Nair", "test_centre": "State Legal Metrology Lab, Pune"},
    {"status": "VERIFIED", "instrument_idx": 1, "days_ago": 30, "officer": "Shri. Ramesh Gupta", "test_centre": "Regional Metrology Centre, Mumbai"},
    {"status": "VERIFIED", "instrument_idx": 2, "days_ago": 60, "officer": "Smt. Deepa Joshi", "test_centre": "District Metrology Lab, Raigad"},
    # Failed
    {"status": "FAILED",   "instrument_idx": 3, "days_ago": 20, "officer": "Shri. Anand Kulkarni", "test_centre": "State Legal Metrology Lab, Pune"},
    # Scheduled
    {"status": "SCHEDULED", "instrument_idx": 4, "days_ago": 5, "officer": "Smt. Kavitha Nair", "test_centre": "State Legal Metrology Lab, Pune"},
    # Submitted / Under Review
    {"status": "SUBMITTED",   "instrument_idx": 0, "days_ago": 2, "officer": None, "test_centre": None},
    {"status": "UNDER_REVIEW","instrument_idx": 1, "days_ago": 3, "officer": None, "test_centre": None},
    {"status": "APPROVED",    "instrument_idx": 2, "days_ago": 4, "officer": None, "test_centre": None},
]


def seed_database(db: Session):
    # Check if already seeded
    if db.query(Instrument).count() > 0:
        print("Database already seeded, skipping.")
        return

    print("Seeding database...")
    year = datetime.utcnow().year

    # ---- Create Instruments ----
    instruments = []
    for data in INSTRUMENTS_DATA:
        inst = Instrument(**data)
        db.add(inst)
        instruments.append(inst)
    db.flush()

    # ---- Create Applications + Inspections + Certificates ----
    for idx, app_data in enumerate(APPLICATIONS_DATA):
        inst = instruments[app_data["instrument_idx"]]
        submitted_at = datetime.utcnow() - timedelta(days=app_data["days_ago"])
        application_id = f"LM-APP-{year}-{str(idx + 1).zfill(3)}"

        status = app_data["status"]
        inspection_date = None
        inspection_time = None
        test_centre = app_data["test_centre"]
        officer = app_data["officer"]

        if status in ["SCHEDULED", "VERIFIED", "FAILED", "UNDER_INSPECTION"]:
            insp_date = submitted_at + timedelta(days=3)
            inspection_date = insp_date.strftime("%Y-%m-%d")
            inspection_time = "10:00"

        app = Application(
            application_id=application_id,
            instrument_id=inst.id,
            status=status,
            submitted_at=submitted_at,
            inspection_date=inspection_date,
            inspection_time=inspection_time,
            test_centre=test_centre,
            assigned_officer=officer,
            priority="HIGH" if idx == 0 else ("NORMAL" if idx < 5 else "LOW"),
            reviewed_at=submitted_at + timedelta(days=1) if status not in ["SUBMITTED"] else None,
            scheduled_at=submitted_at + timedelta(days=2) if status in ["SCHEDULED", "VERIFIED", "FAILED"] else None,
        )
        db.add(app)
        db.flush()

        # Create inspection for VERIFIED / FAILED
        if status in ["VERIFIED", "FAILED"]:
            inspection_id = f"LM-INS-{submitted_at.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            result = "PASS" if status == "VERIFIED" else "FAIL"

            inspection = Inspection(
                inspection_id=inspection_id,
                application_id=app.id,
                officer=officer,
                tolerance=0.5,
                result=result,
                max_error_percentage=0.18 if result == "PASS" else 0.72,
                completed_at=submitted_at + timedelta(days=3),
            )
            db.add(inspection)
            db.flush()

            # Add test results
            test_values = [
                (10.0, 10.018 if result == "PASS" else 10.08),
                (20.0, 20.034 if result == "PASS" else 20.145),
                (30.0, 30.051 if result == "PASS" else 30.213),
                (50.0, 50.082 if result == "PASS" else 50.362),
            ]
            for std, obs in test_values:
                err = obs - std
                err_pct = (err / std) * 100
                ir = InspectionResult(
                    inspection_id=inspection.id,
                    standard_value=std,
                    observed_value=obs,
                    error=round(err, 4),
                    error_percentage=round(err_pct, 4),
                    within_tolerance=abs(err_pct) <= 0.5,
                )
                db.add(ir)

            # Create certificate for VERIFIED
            if status == "VERIFIED":
                cert_count = db.query(Certificate).count()
                certificate_id = f"LM-CERT-{year}-{str(cert_count + 1).zfill(3)}"
                qr_token = uuid.uuid4().hex

                # Vary expiry for demo: first two active, third expiring soon
                if idx == 0:
                    valid_until = datetime.utcnow() + timedelta(days=320)  # active
                elif idx == 1:
                    valid_until = datetime.utcnow() + timedelta(days=60)   # expiring soon
                else:
                    valid_until = datetime.utcnow() + timedelta(days=15)   # expiring

                cert = Certificate(
                    certificate_id=certificate_id,
                    instrument_id=inst.id,
                    application_id=app.id,
                    verification_date=submitted_at + timedelta(days=3),
                    valid_until=valid_until,
                    result="PASS",
                    qr_token=qr_token,
                    officer=officer,
                    test_centre=test_centre,
                )
                db.add(cert)

    db.commit()
    print("✅ Database seeded successfully!")
    print(f"   Instruments: {len(INSTRUMENTS_DATA)}")
    print(f"   Applications: {len(APPLICATIONS_DATA)}")
    print(f"   Verified: 3, Failed: 1, Scheduled: 1, Pending: 3")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
