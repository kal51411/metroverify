"""
Auto-seed script for MetroVerify prototype.
Creates realistic sample data for demonstration purposes under the Legal Metrology Act, 2009.
"""

from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Instrument, Application, Inspection, InspectionResult, Certificate


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
        "district": "Pune",
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
        "district": "Mumbai",
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
        "district": "Thane",
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
        "district": "Pune",
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
        "district": "Mumbai",
    },
    {
        "instrument_id": "LM-INST-1006",
        "type": "Automatic Gravimetric Filling Instrument",
        "manufacturer": "Ishida Europe",
        "model": "CCW-R214",
        "serial_number": "IS-CCW-2024-006",
        "capacity": 25.0,
        "unit": "kg",
        "owner_name": "Ganesh Kadam",
        "business_name": "Nashik Agro Packaging Ltd",
        "address": "MIDC Ambad, Nashik, Maharashtra - 422010",
        "district": "Nashik",
    },
]

APPLICATIONS_DATA = [
    # Verified (PASS) with LMO
    {
        "status": "VERIFIED",
        "instrument_idx": 0,
        "days_ago": 45,
        "officer": "Smt. Kavitha Nair (LMO Grade-I)",
        "test_centre": "State Legal Metrology Lab, Pune",
        "allocated_to_type": "LMO",
        "gatc_name": None,
        "app_type": "VERIFICATION",
        "seal": "MH-26-SEAL-1049",
        "district": "Pune",
        "gps": "18.4975° N, 73.8682° E (Market Yard, Pune)",
    },
    # Verified (PASS) with GATC
    {
        "status": "VERIFIED",
        "instrument_idx": 1,
        "days_ago": 30,
        "officer": "Er. D. S. Mehta (Chief Metrologist)",
        "test_centre": "National Test House (GATC Centre #04), Mumbai",
        "allocated_to_type": "GATC",
        "gatc_name": "National Test House (GATC #04)",
        "app_type": "RE_VERIFICATION",
        "seal": "MH-01-GATC-7712",
        "district": "Mumbai",
        "gps": "19.0760° N, 72.8777° E (APMC Market, Vashi)",
    },
    # Verified (PASS) with LMO - Expiring soon (for demo alerts)
    {
        "status": "VERIFIED",
        "instrument_idx": 2,
        "days_ago": 330,
        "officer": "Shri. Ramesh Gupta (LMO Officer)",
        "test_centre": "District Metrology Lab, Raigad",
        "allocated_to_type": "LMO",
        "gatc_name": None,
        "app_type": "RE_VERIFICATION",
        "seal": "MH-04-SEAL-3829",
        "district": "Thane",
        "gps": "18.7905° N, 73.3424° E (Khopoli Highway)",
    },
    # Failed
    {
        "status": "FAILED",
        "instrument_idx": 3,
        "days_ago": 20,
        "officer": "Shri. Anand Kulkarni (Senior Inspector)",
        "test_centre": "Apex Calibration Test Centre (GATC #07), Pune",
        "allocated_to_type": "GATC",
        "gatc_name": "Apex Calibration Test Centre (GATC #07)",
        "app_type": "VERIFICATION",
        "seal": None,
        "district": "Pune",
        "gps": "18.6279° N, 73.8340° E (MIDC Bhosari)",
    },
    # Scheduled
    {
        "status": "SCHEDULED",
        "instrument_idx": 4,
        "days_ago": 5,
        "officer": "Smt. Kavitha Nair (LMO Grade-I)",
        "test_centre": "State Legal Metrology Lab, Pune",
        "allocated_to_type": "LMO",
        "gatc_name": None,
        "app_type": "VERIFICATION",
        "seal": None,
        "district": "Mumbai",
        "gps": None,
    },
    # Submitted / Under Review
    {
        "status": "SUBMITTED",
        "instrument_idx": 0,
        "days_ago": 2,
        "officer": None,
        "test_centre": None,
        "allocated_to_type": "LMO",
        "gatc_name": None,
        "app_type": "RE_VERIFICATION",
        "seal": None,
        "district": "Pune",
        "gps": None,
    },
    {
        "status": "UNDER_REVIEW",
        "instrument_idx": 1,
        "days_ago": 3,
        "officer": None,
        "test_centre": None,
        "allocated_to_type": "GATC",
        "gatc_name": "National Test House (GATC #04)",
        "app_type": "VERIFICATION",
        "seal": None,
        "district": "Mumbai",
        "gps": None,
    },
    {
        "status": "APPROVED",
        "instrument_idx": 5,
        "days_ago": 4,
        "officer": None,
        "test_centre": None,
        "allocated_to_type": "GATC",
        "gatc_name": "Maharashtra State Metrology Laboratory (GATC #01)",
        "app_type": "VERIFICATION",
        "seal": None,
        "district": "Nashik",
        "gps": None,
    },
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
        prefix = "LM-REVER" if app_data["app_type"] == "RE_VERIFICATION" else "LM-APP"
        application_id = f"{prefix}-{year}-{str(idx + 1).zfill(3)}"

        status = app_data["status"]
        inspection_date = None
        inspection_time = None
        test_centre = app_data["test_centre"]
        officer = app_data["officer"]

        if status in ["SCHEDULED", "VERIFIED", "FAILED", "UNDER_INSPECTION"]:
            insp_date = submitted_at + timedelta(days=3)
            inspection_date = insp_date.strftime("%Y-%m-%d")
            inspection_time = "11:00 AM"

        app = Application(
            application_id=application_id,
            instrument_id=inst.id,
            application_type=app_data["app_type"],
            status=status,
            submitted_at=submitted_at,
            inspection_date=inspection_date,
            inspection_time=inspection_time,
            test_centre=test_centre,
            assigned_officer=officer,
            allocated_to_type=app_data["allocated_to_type"],
            gatc_name=app_data["gatc_name"],
            district=app_data["district"],
            priority="HIGH" if idx in [0, 2] else ("NORMAL" if idx < 5 else "LOW"),
            reviewed_at=submitted_at + timedelta(days=1) if status not in ["SUBMITTED"] else None,
            scheduled_at=submitted_at + timedelta(days=2) if status in ["SCHEDULED", "VERIFIED", "FAILED"] else None,
            notes=f"Statutory compliance check under Rule 27 of Legal Metrology Rules, 2011" if app_data["app_type"] == "RE_VERIFICATION" else None,
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
                stamping_seal_no=app_data["seal"],
                gps_location=app_data["gps"],
                is_field_inspection=True,
                completed_at=submitted_at + timedelta(days=3),
            )
            db.add(inspection)
            db.flush()

            # Add test calibration points
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

                # First cert active (320 days left), second active (60 days left), third expiring (15 days left)
                if idx == 0:
                    valid_until = datetime.utcnow() + timedelta(days=320)
                elif idx == 1:
                    valid_until = datetime.utcnow() + timedelta(days=60)
                else:
                    valid_until = datetime.utcnow() + timedelta(days=15)

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
                    allocated_to_type=app_data["allocated_to_type"],
                    verification_type=app_data["app_type"],
                    stamping_seal_no=app_data["seal"],
                    district=app_data["district"],
                )
                db.add(cert)
                inst.last_verified_at = submitted_at + timedelta(days=3)

    db.commit()
    print("✅ Database seeded successfully with GATC and Re-verification data!")
    print(f"   Instruments: {len(INSTRUMENTS_DATA)}")
    print(f"   Applications: {len(APPLICATIONS_DATA)}")
    print(f"   GATC Allocated: 3, LMO Allocated: 5")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
