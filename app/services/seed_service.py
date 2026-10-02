from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import hashlib

from app.models.users import User, RoleEnum
from app.models.jurisdictions import Jurisdiction, Office
from app.models.instruments import Instrument, InstrumentStatusEnum, AccuracyClassEnum
from app.models.standards import StandardAsset, StandardHierarchyEnum, AssetStatusEnum
from app.models.applications import (
    Application, ApplicationDocument, PaymentRecord,
    ApplicationStatusEnum, ApplicationTypeEnum, JurisdictionStatusEnum,
    DocumentStatusEnum, DocumentTypeEnum
)
from app.models.rulesets import Ruleset, MPEBand, FeeRule, VerificationIntervalRule
from app.models.inspections import Inspection, TestMeasurement, SealRecord
from app.models.certificates import VerificationCertificate, CertificateStatusEnum
from app.services.audit_service import AuditService
from app.rules.base import DEFAULT_RULESET_VERSION
from app.rules.fees import MAHARASHTRA_FEE_SCHEDULE_2018
from app.rules.jurisdictions import MAHARASHTRA_JURISDICTIONS_DATA

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

def seed_database(db: Session, force: bool = False):
    """
    Seeds initial reference data and honest synthetic DEMO data.
    Will only create sample instruments/applications if database is fresh or forced.
    """
    # 1. Jurisdictions & Offices
    if db.query(Jurisdiction).count() == 0:
        for item in MAHARASHTRA_JURISDICTIONS_DATA:
            j = Jurisdiction(
                code=item["code"],
                state="Maharashtra",
                division=item["division"],
                district=item["district"],
                office_name=item["office_name"],
                office_address=f"Legal Metrology Bhavan, {item["district"]}, Maharashtra",
                contact_phone="+91-22-22020000"
            )
            db.add(j)
        db.flush()

    # 2. Reference Fee Rules
    if db.query(FeeRule).count() == 0:
        for f in MAHARASHTRA_FEE_SCHEDULE_2018:
            fr = FeeRule(
                fee_schedule_code="MH_LM_FEE_2018",
                instrument_type=f["type"],
                min_capacity=f["min_cap"],
                max_capacity=f["max_cap"],
                unit="kg",
                base_fee=f["base_fee"],
                additional_fee_rule=f"Premises fee: INR {f["premises_extra"]}",
                effective_from=datetime(2018, 4, 20),
                source_notification="Maharashtra LM Fee Notification 20-04-2018"
            )
            db.add(fr)
        db.flush()

    # 3. Standard Assets (Traceable Working Standards)
    if db.query(StandardAsset).count() == 0:
        now = datetime.utcnow()
        assets = [
            StandardAsset(
                standard_asset_id="STD-M1-20KG-001",
                asset_tag="MH-LM-STD-2026-01",
                nominal_mass=20.0,
                unit="kg",
                accuracy_class="M1",
                certificate_number="RRSL-PUN-2026-CAL-1042",
                calibration_date=now - timedelta(days=60),
                valid_until=now + timedelta(days=305),
                laboratory="Regional Reference Standard Laboratory, Pune",
                traceability_reference="National Physical Laboratory (NPL) Traceable Standard Mass #NPL-IND-881",
                hierarchy_level=StandardHierarchyEnum.WORKING_STANDARD,
                current_location="Pune Legal Metrology Mobile Inspection Unit #1",
                status=AssetStatusEnum.ACTIVE,
                condition="EXCELLENT",
                serial_number="M1-20KG-9921",
                notes="Standard working mass set verified in accordance with Schedule VII Rules."
            ),
            StandardAsset(
                standard_asset_id="STD-M1-50KG-002",
                asset_tag="MH-LM-STD-2026-02",
                nominal_mass=50.0,
                unit="kg",
                accuracy_class="M1",
                certificate_number="RRSL-PUN-2026-CAL-1043",
                calibration_date=now - timedelta(days=60),
                valid_until=now + timedelta(days=305),
                laboratory="Regional Reference Standard Laboratory, Pune",
                traceability_reference="NPL Traceable Standard Mass #NPL-IND-882",
                hierarchy_level=StandardHierarchyEnum.WORKING_STANDARD,
                current_location="Pune Legal Metrology Mobile Inspection Unit #1",
                status=AssetStatusEnum.ACTIVE,
                condition="EXCELLENT",
                serial_number="M1-50KG-9922",
                notes="Cast iron bar standard working mass."
            ),
            StandardAsset(
                standard_asset_id="STD-F2-500G-003",
                asset_tag="MH-LM-STD-2026-03",
                nominal_mass=0.5,
                unit="kg",
                accuracy_class="F2",
                certificate_number="RRSL-MUM-2026-CAL-0891",
                calibration_date=now - timedelta(days=30),
                valid_until=now + timedelta(days=335),
                laboratory="Regional Reference Standard Laboratory, Mumbai",
                traceability_reference="NPL Traceable Standard Mass #NPL-IND-441",
                hierarchy_level=StandardHierarchyEnum.SECONDARY_STANDARD,
                current_location="Mumbai Central Standards Vault",
                status=AssetStatusEnum.ACTIVE,
                condition="EXCELLENT",
                serial_number="F2-500G-1102",
                notes="Precision stainless steel standard mass."
            ),
            StandardAsset(
                standard_asset_id="STD-M1-1000KG-004",
                asset_tag="MH-LM-STD-2026-04",
                nominal_mass=1000.0,
                unit="kg",
                accuracy_class="M1",
                certificate_number="RRSL-PUN-2026-CAL-2001",
                calibration_date=now - timedelta(days=45),
                valid_until=now + timedelta(days=320),
                laboratory="Regional Reference Standard Laboratory, Pune",
                traceability_reference="NPL Traceable Block Mass #NPL-IND-991",
                hierarchy_level=StandardHierarchyEnum.WORKING_STANDARD,
                current_location="Heavy Capacity Weighbridge Test Truck #MH-12-LM-01",
                status=AssetStatusEnum.ACTIVE,
                condition="EXCELLENT",
                serial_number="M1-1T-004",
                notes="1000 kg test block mass for weighbridge verification."
            )
        ]
        for a in assets:
            db.add(a)
        db.flush()

    # 4. Users (Applicant, Inspector, Supervisor, Admin)
    if db.query(User).count() == 0:
        pune_jur = db.query(Jurisdiction).filter(Jurisdiction.district == "Pune").first()
        jur_id = pune_jur.id if pune_jur else 1
        
        users = [
            User(
                username="applicant_demo",
                email="trader.demo@metroverify.local",
                full_name="Rajesh Sharma (Demo Trader)",
                hashed_password=hash_pw("demo123"),
                role=RoleEnum.APPLICANT,
                designation="Proprietor",
                department="Commercial Trade",
                jurisdiction_id=jur_id
            ),
            User(
                username="inspector_pune",
                email="inspector.pune@metroverify.local",
                full_name="Vikram Patil",
                hashed_password=hash_pw("demo123"),
                role=RoleEnum.INSPECTOR,
                designation="Inspector Legal Metrology",
                department="Pune District Enforcement Division",
                jurisdiction_id=jur_id
            ),
            User(
                username="supervisor_maha",
                email="supervisor@metroverify.local",
                full_name="Sunil Deshmukh",
                hashed_password=hash_pw("demo123"),
                role=RoleEnum.SUPERVISOR,
                designation="Assistant Controller Legal Metrology",
                department="Maharashtra State Enforcement Directorate",
                jurisdiction_id=jur_id
            ),
            User(
                username="admin",
                email="admin@metroverify.local",
                full_name="System Administrator",
                hashed_password=hash_pw("admin123"),
                role=RoleEnum.ADMIN,
                designation="Metrology IT Administrator",
                department="Directorate of Legal Metrology"
            )
        ]
        for u in users:
            db.add(u)
        db.flush()

    # 5. Synthetic Demo Instruments & Applications
    if db.query(Instrument).count() == 0:
        applicant = db.query(User).filter(User.username == "applicant_demo").first()
        inspector = db.query(User).filter(User.username == "inspector_pune").first()
        pune_jur = db.query(Jurisdiction).filter(Jurisdiction.district == "Pune").first()
        
        now = datetime.utcnow()
        
        # Instrument 1: Synthetic 150 kg Electronic Platform Scale (Class III)
        inst1 = Instrument(
            instrument_id="LM-INST-DEMO-1001",
            instrument_type="NON_AUTOMATIC_WEIGHING_INSTRUMENT",
            manufacturer="DemoScale Metrology Systems [SYNTHETIC DEMO]",
            model="DS-150P",
            serial_number="SYNTH-DS-2026-9811",
            model_approval_number="IND/09/2024/412",
            accuracy_class=AccuracyClassEnum.CLASS_III,
            max_capacity=150.0,
            min_capacity=1.0,
            verification_scale_interval_e=0.05,
            actual_scale_interval_d=0.01,
            unit="kg",
            installation_location="Shop #4, Market Yard, Gultekdi, Pune",
            owner_name="Rajesh Sharma [DEMO DATA]",
            business_name="Sharma Agro Commodities [DEMO DATA]",
            address="Plot 12, APMC Market Yard, Pune - 411037",
            district="Pune",
            division="Pune",
            jurisdiction_id=pune_jur.id if pune_jur else 1,
            status=InstrumentStatusEnum.PENDING_VERIFICATION,
            seal_configuration="Dual wire seal through load cell junction box and calibration button cover.",
            verification_mark_location="Stamping plate on right side chassis."
        )
        db.add(inst1)
        
        # Instrument 2: Synthetic 60-Tonne Heavy Weighbridge (Class III)
        inst2 = Instrument(
            instrument_id="LM-INST-DEMO-1002",
            instrument_type="WEIGHBRIDGE",
            manufacturer="PrecisionBridge Industries [SYNTHETIC DEMO]",
            model="PB-60T-PITLESS",
            serial_number="SYNTH-WB-2026-6002",
            model_approval_number="IND/09/2023/188",
            accuracy_class=AccuracyClassEnum.CLASS_III,
            max_capacity=60000.0,
            min_capacity=400.0,
            verification_scale_interval_e=20.0,
            actual_scale_interval_d=10.0,
            unit="kg",
            installation_location="Gate 2, Chakan Industrial Area Phase II, Pune",
            owner_name="Chakan Logistics Hub [DEMO DATA]",
            business_name="Chakan Logistics Hub Pvt Ltd [DEMO DATA]",
            address="Plot 55, Chakan MIDC, Pune - 410501",
            district="Pune",
            division="Pune",
            jurisdiction_id=pune_jur.id if pune_jur else 1,
            status=InstrumentStatusEnum.PENDING_VERIFICATION,
            seal_configuration="4-point corner junction box seals and indicator security sticker.",
            verification_mark_location="Weight indicator enclosure and pit entrance brass plate."
        )
        db.add(inst2)
        db.flush()
        
        # Application 1 for Instrument 1
        app1 = Application(
            application_id="LM-APP-2026-001",
            instrument_id=inst1.id,
            applicant_id=applicant.id,
            application_type=ApplicationTypeEnum.NEW_VERIFICATION,
            status=ApplicationStatusEnum.SCHEDULED,
            is_premises_verification=True,
            advance_notice_days=30,
            jurisdiction_id=pune_jur.id if pune_jur else 1,
            jurisdiction_status=JurisdictionStatusEnum.VALID_JURISDICTION,
            assigned_inspector_id=inspector.id,
            scheduled_date=(now + timedelta(days=2)).strftime("%Y-%m-%d"),
            scheduled_time="11:00 AM",
            test_centre_or_premises="Trader Premises (Market Yard Pune)",
            priority="NORMAL",
            notes="Initial statutory verification for newly installed electronic platform scale.",
            submitted_at=now - timedelta(days=3),
            reviewed_at=now - timedelta(days=2),
            scheduled_at=now - timedelta(days=1)
        )
        db.add(app1)
        db.flush()
        
        # Add Documents to Application 1
        doc1 = ApplicationDocument(
            document_id="DOC-2026-001",
            application_id=app1.id,
            document_type=DocumentTypeEnum.PURCHASE_BILL,
            title="Tax Invoice & Purchase Bill",
            file_path="uploads/demo_invoice_sharma.pdf",
            file_name="demo_invoice_sharma.pdf",
            file_size=142800,
            status=DocumentStatusEnum.ACCEPTED,
            uploaded_at=now - timedelta(days=3),
            verified_at=now - timedelta(days=2),
            verified_by=inspector.full_name
        )
        doc2 = ApplicationDocument(
            document_id="DOC-2026-002",
            application_id=app1.id,
            document_type=DocumentTypeEnum.MODEL_APPROVAL_CERTIFICATE,
            title="Government Model Approval Certificate",
            file_path="uploads/model_approval_ind092024.pdf",
            file_name="model_approval_ind092024.pdf",
            file_size=285100,
            status=DocumentStatusEnum.ACCEPTED,
            uploaded_at=now - timedelta(days=3),
            verified_at=now - timedelta(days=2),
            verified_by=inspector.full_name
        )
        db.add(doc1)
        db.add(doc2)
        
        # Payment for Application 1
        pay1 = PaymentRecord(
            payment_id="PAY-GRAS-2026-001",
            application_id=app1.id,
            challan_number="MH-GRAS-CH-2026-88192",
            gras_grn="GRN2026MH0981241",
            scroll_number="SCR-PUN-0912",
            amount=350.0,
            payment_date=now - timedelta(days=3),
            payment_status="VERIFIED",
            fee_breakdown="Base verification fee: INR 200.0, Premises verification: INR 150.0",
            verified_by=inspector.full_name,
            verified_at=now - timedelta(days=2)
        )
        db.add(pay1)
        
        # Application 2 for Instrument 2 (Weighbridge)
        app2 = Application(
            application_id="LM-APP-2026-002",
            instrument_id=inst2.id,
            applicant_id=applicant.id,
            application_type=ApplicationTypeEnum.NEW_VERIFICATION,
            status=ApplicationStatusEnum.APPROVED,
            is_premises_verification=True,
            advance_notice_days=30,
            jurisdiction_id=pune_jur.id if pune_jur else 1,
            jurisdiction_status=JurisdictionStatusEnum.VALID_JURISDICTION,
            assigned_inspector_id=inspector.id,
            priority="HIGH",
            notes="60-tonne weighbridge verification requiring heavy test truck and standard weight substitution evaluation.",
            submitted_at=now - timedelta(days=1),
            reviewed_at=now
        )
        db.add(app2)
        
        db.flush()
        
        AuditService.log_event(
            db=db,
            action="SYSTEM_INITIALIZATION_SEEDED",
            entity_type="System",
            entity_id="ROOT",
            user_id="SYSTEM",
            user_role="ADMIN",
            new_value={"status": "SEEDED", "instruments": 2, "applications": 2, "standards": 4}
        )
        
    db.commit()
    print("Database seeding completed successfully!")
