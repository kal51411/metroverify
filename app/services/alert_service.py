from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
import uuid

from app.models.alerts import ValidityAlert, AlertSeverityEnum, AlertStatusEnum
from app.models.instruments import Instrument, InstrumentStatusEnum
from app.models.certificates import VerificationCertificate, CertificateStatusEnum
from app.models.applications import Application, ApplicationStatusEnum, ApplicationTypeEnum, JurisdictionStatusEnum
from app.models.jurisdictions import Jurisdiction
from app.rules.jurisdictions import validate_application_jurisdiction
from app.services.audit_service import AuditService

class AlertService:
    @classmethod
    def scan_and_generate_alerts(cls, db: Session) -> dict:
        """
        Scans all instruments and active certificates to identify validity expiration
        and generates or refreshes statutory alerts.
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        instruments = db.query(Instrument).all()
        created_count = 0
        updated_count = 0

        for inst in instruments:
            # Determine due date from instrument or active certificate
            due_date = inst.next_due_date
            cert = db.query(VerificationCertificate).filter(
                VerificationCertificate.instrument_id == inst.id,
                VerificationCertificate.status == CertificateStatusEnum.ACTIVE
            ).order_by(VerificationCertificate.valid_until.desc()).first()

            if cert and cert.valid_until:
                due_date = cert.valid_until

            if not due_date:
                # If instrument has no due date yet, check if it's unverified
                continue

            days_remaining = (due_date - now).days

            # Only generate alerts if within 60 days or expired
            if days_remaining > 60:
                continue

            # Determine severity and alert type
            if days_remaining < 0:
                severity = AlertSeverityEnum.EXPIRED
                alert_type = "EXPIRED"
                msg = (
                    f"Statutory verification for {inst.manufacturer} {inst.model} "
                    f"(Serial #{inst.serial_number}) expired on {due_date.strftime('%d-%b-%Y')}. "
                    f"Commercial use without re-verification violates Section 24 of the Legal Metrology Act, 2009."
                )
                inst.status = InstrumentStatusEnum.EXPIRED
            elif days_remaining <= 15:
                severity = AlertSeverityEnum.CRITICAL
                alert_type = "EXPIRING_SOON_15D"
                msg = (
                    f"CRITICAL COMPLIANCE NOTICE: Verification for {inst.manufacturer} {inst.model} "
                    f"(Serial #{inst.serial_number}) expires in {days_remaining} days on {due_date.strftime('%d-%b-%Y')}. "
                    f"Schedule immediate re-verification to prevent statutory penalties."
                )
            elif days_remaining <= 30:
                severity = AlertSeverityEnum.WARNING
                alert_type = "EXPIRING_SOON_30D"
                msg = (
                    f"Statutory verification for {inst.manufacturer} {inst.model} "
                    f"(Serial #{inst.serial_number}) is due for renewal in {days_remaining} days on {due_date.strftime('%d-%b-%Y')} "
                    f"under Rule 27 of Legal Metrology (General) Rules."
                )
            else:
                severity = AlertSeverityEnum.INFO
                alert_type = "EXPIRING_SOON_60D"
                msg = (
                    f"Upcoming verification window: {inst.manufacturer} {inst.model} "
                    f"(Serial #{inst.serial_number}) valid until {due_date.strftime('%d-%b-%Y')} ({days_remaining} days remaining)."
                )

            # Check if alert already exists for this instrument and type
            existing_alert = db.query(ValidityAlert).filter(
                ValidityAlert.instrument_id == inst.id,
                ValidityAlert.status != AlertStatusEnum.RENEWAL_SUBMITTED
            ).first()

            # Find applicant user if any
            user_id = None
            last_app = db.query(Application).filter(Application.instrument_id == inst.id).order_by(Application.id.desc()).first()
            if last_app:
                user_id = last_app.applicant_id

            if existing_alert:
                existing_alert.days_remaining = days_remaining
                existing_alert.severity = severity
                existing_alert.alert_type = alert_type
                existing_alert.message = msg
                existing_alert.due_date = due_date
                if cert:
                    existing_alert.certificate_id = cert.id
                updated_count += 1
            else:
                alert_code = f"ALT-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
                alert = ValidityAlert(
                    alert_id=alert_code,
                    instrument_id=inst.id,
                    certificate_id=cert.id if cert else None,
                    user_id=user_id,
                    alert_type=alert_type,
                    severity=severity,
                    status=AlertStatusEnum.ACTIVE,
                    days_remaining=days_remaining,
                    due_date=due_date,
                    message=msg,
                    statutory_rule_ref="Legal Metrology (General) Rules, 2011 - Rule 27",
                    created_at=now
                )
                db.add(alert)
                created_count += 1

        db.commit()
        return {
            "status": "SUCCESS",
            "alerts_created": created_count,
            "alerts_updated": updated_count,
            "total_active_alerts": db.query(ValidityAlert).filter(ValidityAlert.status == AlertStatusEnum.ACTIVE).count()
        }

    @classmethod
    def get_alerts(cls, db: Session, user_id: Optional[int] = None, severity: Optional[str] = None) -> List[dict]:
        q = db.query(ValidityAlert).options(
            joinedload(ValidityAlert.instrument),
            joinedload(ValidityAlert.certificate)
        )
        if user_id:
            q = q.filter(ValidityAlert.user_id == user_id)
        if severity and severity != "ALL":
            q = q.filter(ValidityAlert.severity == severity)

        alerts = q.order_by(ValidityAlert.days_remaining.asc()).all()
        result = []
        for a in alerts:
            inst = a.instrument
            result.append({
                "id": a.id,
                "alert_id": a.alert_id,
                "instrument_id": a.instrument_id,
                "certificate_id": a.certificate_id,
                "user_id": a.user_id,
                "alert_type": a.alert_type,
                "severity": a.severity.value if hasattr(a.severity, "value") else str(a.severity),
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "days_remaining": a.days_remaining,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "message": a.message,
                "statutory_rule_ref": a.statutory_rule_ref,
                "renewal_application_id": a.renewal_application_id,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "instrument": {
                    "id": inst.id if inst else None,
                    "instrument_id": inst.instrument_id if inst else "N/A",
                    "manufacturer": inst.manufacturer if inst else "N/A",
                    "model": inst.model if inst else "N/A",
                    "serial_number": inst.serial_number if inst else "N/A",
                    "max_capacity": inst.max_capacity if inst else 0,
                    "unit": inst.unit if inst else "kg",
                    "district": inst.district if inst else "N/A",
                    "business_name": inst.business_name if inst else "N/A"
                } if inst else None
            })
        return result

    @classmethod
    def acknowledge_alert(cls, db: Session, alert_id: int) -> dict:
        alert = db.query(ValidityAlert).filter(ValidityAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found.")
        alert.status = AlertStatusEnum.ACKNOWLEDGED
        alert.acknowledged_at = datetime.utcnow()
        db.commit()
        return {"status": "SUCCESS", "alert_id": alert.alert_id, "state": "ACKNOWLEDGED"}

    @classmethod
    def execute_1click_renewal(cls, db: Session, alert_id: int, applicant_id: int = 1) -> dict:
        alert = db.query(ValidityAlert).options(joinedload(ValidityAlert.instrument)).filter(ValidityAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert record not found.")

        inst = alert.instrument
        if not inst:
            raise HTTPException(status_code=404, detail="Associated instrument not found.")

        # If already renewed, return existing app
        if alert.renewal_application_id:
            existing_app = db.query(Application).filter(Application.id == alert.renewal_application_id).first()
            if existing_app:
                return {
                    "status": "ALREADY_SUBMITTED",
                    "application_id": existing_app.id,
                    "application_code": existing_app.application_id,
                    "message": "Re-verification application is already active for this instrument."
                }

        now = datetime.utcnow()
        count = db.query(Application).count() + 1
        app_code = f"LM-APP-RENEW-{now.year}-{str(count).zfill(4)}"

        # Scrutiny jurisdiction
        jur_check = validate_application_jurisdiction(inst.district, inst.division)
        jur_status = JurisdictionStatusEnum(jur_check["jurisdiction_status"])
        jur = db.query(Jurisdiction).filter(Jurisdiction.district.ilike(inst.district.strip())).first()
        jur_id = jur.id if jur else None

        renewal_app = Application(
            application_id=app_code,
            instrument_id=inst.id,
            applicant_id=applicant_id or alert.user_id or 1,
            application_type=ApplicationTypeEnum.RE_VERIFICATION,
            status=ApplicationStatusEnum.SUBMITTED,
            is_premises_verification=True,
            advance_notice_days=15,
            jurisdiction_id=jur_id,
            jurisdiction_status=jur_status,
            jurisdiction_notes=f"Statutory Re-verification expedited via Validity Alert {alert.alert_id}",
            priority="HIGH" if alert.severity in (AlertSeverityEnum.CRITICAL, AlertSeverityEnum.EXPIRED) else "NORMAL",
            notes=f"Automated 1-Click Periodic Re-verification under Rule 27. Previous expiry: {alert.due_date.strftime('%Y-%m-%d') if alert.due_date else 'N/A'}",
            submitted_at=now
        )
        db.add(renewal_app)
        db.flush()

        # Update alert
        alert.status = AlertStatusEnum.RENEWAL_SUBMITTED
        alert.renewal_application_id = renewal_app.id
        inst.status = InstrumentStatusEnum.PENDING_VERIFICATION

        AuditService.log_event(
            db=db,
            action="EXPEDITED_REVERIFICATION_SUBMITTED",
            entity_type="Application",
            entity_id=app_code,
            user_id=str(applicant_id),
            user_role="APPLICANT",
            new_value={
                "alert_id": alert.alert_id,
                "instrument_id": inst.instrument_id,
                "serial_number": inst.serial_number
            }
        )

        db.commit()
        return {
            "status": "SUCCESS",
            "application_id": renewal_app.id,
            "application_code": app_code,
            "message": f"Statutory Re-verification application {app_code} created successfully."
        }
