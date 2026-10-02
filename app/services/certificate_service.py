import hashlib
import uuid
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.certificates import VerificationCertificate, CertificateStatusEnum
from app.models.applications import Application, ApplicationStatusEnum
from app.models.instruments import Instrument, InstrumentStatusEnum
from app.models.inspections import Inspection
from app.rules.verification_intervals import determine_verification_interval
from app.services.audit_service import AuditService
from app.config import settings

class CertificateService:
    @staticmethod
    def compute_certificate_hash(
        certificate_id: str,
        instrument_id: str,
        inspection_id: str,
        result: str,
        verification_date_str: str,
        valid_until_str: str,
        ruleset_version: str
    ) -> str:
        payload = f"{certificate_id}:{instrument_id}:{inspection_id}:{result}:{verification_date_str}:{valid_until_str}:{ruleset_version}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @classmethod
    def generate_certificate_for_application(
        cls,
        db: Session,
        application_id: int,
        officer_user_id: int
    ) -> VerificationCertificate:
        app = db.query(Application).options(
            joinedload(Application.instrument),
            joinedload(Application.inspection)
        ).filter(Application.id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found.")
            
        if not app.inspection or app.inspection.final_result != "PASS":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot generate certificate: Inspection has not passed (Status: {app.inspection.final_result if app.inspection else NO_INSPECTION})."
            )
            
        # Check if already issued
        existing_cert = db.query(VerificationCertificate).filter(
            VerificationCertificate.application_id == application_id
        ).first()
        if existing_cert:
            return existing_cert
            
        inst = app.instrument
        now = datetime.utcnow()
        year = now.year
        count = db.query(VerificationCertificate).count() + 1
        cert_num = f"LM-CERT-{year}-{str(count).zfill(4)}"
        
        interval_info = determine_verification_interval(
            instrument_category=inst.instrument_type,
            instrument_type=inst.instrument_type,
            verification_date=now
        )
        
        verification_date = now
        valid_until = interval_info["next_due_date"]
        interval_months = interval_info["interval_months"]
        qr_token = f"tok_{uuid.uuid4().hex}"
        
        vdate_str = verification_date.strftime("%Y-%m-%d")
        due_str = valid_until.strftime("%Y-%m-%d")
        
        cert_hash = cls.compute_certificate_hash(
            certificate_id=cert_num,
            instrument_id=inst.instrument_id,
            inspection_id=app.inspection.inspection_id,
            result="PASS",
            verification_date_str=vdate_str,
            valid_until_str=due_str,
            ruleset_version=app.inspection.ruleset_version
        )
        
        officer_name = "Inspector Legal Metrology"
        if app.assigned_inspector_id:
            from app.models.users import User
            inspector_user = db.query(User).filter(User.id == app.assigned_inspector_id).first()
            if inspector_user:
                officer_name = inspector_user.full_name
                
        office_name = "State Directorate Legal Metrology Maharashtra"
        if app.jurisdiction:
            office_name = app.jurisdiction.office_name
            
        # Extract payment reference if available
        fee_ref = "GRAS-MH-2026-CHALLAN"
        if app.payments:
            p = app.payments[0]
            fee_ref = p.gras_grn or p.challan_number
            
        cert = VerificationCertificate(
            certificate_id=cert_num,
            certificate_number=cert_num,
            application_id=app.id,
            instrument_id=inst.id,
            inspection_id=app.inspection.id,
            verification_date=verification_date,
            valid_until=valid_until,
            interval_months=interval_months,
            result="PASS",
            officer_name=officer_name,
            officer_designation="Inspector / Assistant Controller Legal Metrology",
            office_name=office_name,
            test_location=app.test_centre_or_premises or "Premises of User",
            fee_reference=fee_ref,
            previous_certificate_number=inst.previous_certificate_id,
            ruleset_version=app.inspection.ruleset_version,
            certificate_version="2.0",
            qr_token=qr_token,
            certificate_hash=cert_hash,
            status=CertificateStatusEnum.ACTIVE
        )
        db.add(cert)
        
        # Update instrument & application statuses
        app.status = ApplicationStatusEnum.CERTIFICATE_ISSUED
        app.completed_at = now
        inst.status = InstrumentStatusEnum.VERIFIED
        inst.last_verification_date = verification_date
        inst.next_due_date = valid_until
        inst.previous_certificate_id = cert_num
        
        db.flush()
        
        AuditService.log_event(
            db=db,
            action="CERTIFICATE_ISSUED",
            entity_type="VerificationCertificate",
            entity_id=cert.certificate_number,
            user_id=str(officer_user_id),
            user_role="INSPECTOR",
            new_value={"certificate_id": cert.certificate_number, "valid_until": str(valid_until), "hash": cert_hash}
        )
        
        db.commit()
        db.refresh(cert)
        return cert

    @classmethod
    def verify_public_certificate(cls, db: Session, certificate_ref: str) -> dict:
        cert = db.query(VerificationCertificate).options(
            joinedload(VerificationCertificate.instrument),
            joinedload(VerificationCertificate.application),
            joinedload(VerificationCertificate.inspection)
        ).filter(
            (VerificationCertificate.certificate_id == certificate_ref) |
            (VerificationCertificate.certificate_number == certificate_ref) |
            (VerificationCertificate.qr_token == certificate_ref) |
            (VerificationCertificate.certificate_hash == certificate_ref)
        ).first()
        
        if not cert:
            return {
                "is_valid": False,
                "status": "NOT_FOUND",
                "status_label": "CERTIFICATE NOT FOUND",
                "certificate_id": certificate_ref,
                "certificate_number": certificate_ref,
                "instrument_id": "N/A",
                "instrument_type": "N/A",
                "manufacturer": "N/A",
                "model": "N/A",
                "serial_number": "N/A",
                "accuracy_class": "N/A",
                "max_capacity": 0.0,
                "verification_scale_interval_e": 0.0,
                "unit": "kg",
                "owner_name": "N/A",
                "business_name": "N/A",
                "address": "N/A",
                "verification_date": datetime.utcnow(),
                "valid_until": datetime.utcnow(),
                "interval_months": 0,
                "result": "UNKNOWN",
                "officer_name": "N/A",
                "office_name": "N/A",
                "test_location": "N/A",
                "ruleset_version": "N/A",
                "certificate_hash": "N/A",
                "hash_verified": False,
                "is_demo": False,
                "disclaimer": "The requested certificate reference does not match any record in the MetroVerify ledger."
            }
            
        inst = cert.instrument
        now = datetime.utcnow()
        is_expired = cert.valid_until < now
        
        # Determine status
        if cert.status == CertificateStatusEnum.REVOKED:
            status = "REVOKED"
            status_label = "REVOKED / CANCELLED"
            is_valid = False
        elif cert.status == CertificateStatusEnum.SUSPENDED:
            status = "SUSPENDED"
            status_label = "SUSPENDED"
            is_valid = False
        elif is_expired:
            status = "EXPIRED"
            status_label = "EXPIRED (REQUIRES RE-VERIFICATION)"
            is_valid = False
        else:
            status = "VALID"
            status_label = "VALID & ACTIVE"
            is_valid = True
            
        # Re-verify hash
        vdate_str = cert.verification_date.strftime("%Y-%m-%d")
        due_str = cert.valid_until.strftime("%Y-%m-%d")
        expected_hash = cls.compute_certificate_hash(
            certificate_id=cert.certificate_number,
            instrument_id=inst.instrument_id,
            inspection_id=cert.inspection.inspection_id if cert.inspection else "INSP-RECORD",
            result=cert.result,
            verification_date_str=vdate_str,
            valid_until_str=due_str,
            ruleset_version=cert.ruleset_version
        )
        hash_verified = (expected_hash == cert.certificate_hash)
        
        is_demo = "DEMO" in (inst.instrument_id or "").upper() or "SYNTHETIC" in (inst.business_name or "").upper()
        
        return {
            "is_valid": is_valid and hash_verified,
            "status": status,
            "status_label": status_label,
            "certificate_id": cert.certificate_id,
            "certificate_number": cert.certificate_number,
            "instrument_id": inst.instrument_id,
            "instrument_type": inst.instrument_type,
            "manufacturer": inst.manufacturer,
            "model": inst.model,
            "serial_number": inst.serial_number,
            "accuracy_class": inst.accuracy_class.value if hasattr(inst.accuracy_class, "value") else str(inst.accuracy_class),
            "max_capacity": inst.max_capacity,
            "verification_scale_interval_e": inst.verification_scale_interval_e,
            "unit": inst.unit,
            "owner_name": inst.owner_name,
            "business_name": inst.business_name,
            "address": inst.address,
            "verification_date": cert.verification_date,
            "valid_until": cert.valid_until,
            "interval_months": cert.interval_months,
            "result": cert.result,
            "officer_name": cert.officer_name,
            "office_name": cert.office_name,
            "test_location": cert.test_location,
            "ruleset_version": cert.ruleset_version,
            "certificate_hash": cert.certificate_hash,
            "hash_verified": hash_verified,
            "is_demo": is_demo,
            "disclaimer": "MetroVerify Digital Verification Record. Confirms automated inspection compliance according to Indian Legal Metrology Rules."
        }
