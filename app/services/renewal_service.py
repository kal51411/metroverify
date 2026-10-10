from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.applications import Application, ApplicationStatusEnum, ApplicationTypeEnum
from app.models.certificates import VerificationCertificate
from app.models.users import User
from app.services.audit_service import AuditService


_TERMINAL_APPLICATION_STATUSES = {
    ApplicationStatusEnum.CERTIFICATE_ISSUED,
    ApplicationStatusEnum.ACTIVE,
    ApplicationStatusEnum.REJECTED,
    ApplicationStatusEnum.CANCELLED,
}


def _days_until_expiry(valid_until: datetime) -> int:
    return (valid_until.date() - datetime.utcnow().date()).days


def _sla_bucket(days: int) -> str:
    if days < 0:
        return "OVERDUE"
    if days <= 7:
        return "CRITICAL_7_DAYS"
    if days <= 30:
        return "HIGH_30_DAYS"
    if days <= 90:
        return "MEDIUM_90_DAYS"
    return "NORMAL"


def _latest_renewal_app(db: Session, instrument_id: int) -> Optional[Application]:
    return (
        db.query(Application)
        .filter(
            Application.instrument_id == instrument_id,
            Application.application_type == ApplicationTypeEnum.RE_VERIFICATION,
        )
        .order_by(Application.submitted_at.desc())
        .first()
    )


class RenewalService:
    @staticmethod
    def list_renewal_candidates(
        db: Session,
        window_days: int = 90,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> Dict:
        now = datetime.utcnow()
        due_date = now + timedelta(days=window_days)

        q = db.query(VerificationCertificate).options(
            joinedload(VerificationCertificate.instrument),
        ).filter(VerificationCertificate.valid_until <= due_date)

        if search:
            needle = f"%{search.strip()}%"
            q = q.join(VerificationCertificate.instrument).filter(
                (VerificationCertificate.certificate_number.ilike(needle))
                | (VerificationCertificate.certificate_id.ilike(needle))
                | (VerificationCertificate.qr_token.ilike(needle))
                | (VerificationCertificate.certificate_hash.ilike(needle))
            )

        total = q.count()
        certs = (
            q.order_by(VerificationCertificate.valid_until.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items: List[Dict] = []
        for cert in certs:
            inst = cert.instrument
            days = _days_until_expiry(cert.valid_until)
            latest = _latest_renewal_app(db, cert.instrument_id)

            items.append(
                {
                    "certificate_id": cert.id,
                    "certificate_number": cert.certificate_number,
                    "valid_until": cert.valid_until,
                    "days_until_expiry": days,
                    "sla_bucket": _sla_bucket(days),
                    "owner_name": inst.owner_name if inst else "N/A",
                    "business_name": inst.business_name if inst else "N/A",
                    "instrument_id": inst.instrument_id if inst else "N/A",
                    "instrument_type": inst.instrument_type if inst else "N/A",
                    "serial_number": inst.serial_number if inst else "N/A",
                    "district": inst.district if inst else "N/A",
                    "latest_application_status": latest.status.value if latest else None,
                    "renewal_application_id": latest.application_id if latest else None,
                }
            )

        return {"items": items, "total": total, "page": page, "page_size": page_size}

    @staticmethod
    def send_reminders(
        db: Session,
        certificate_id: int,
        channels: List[str],
        actor: User,
        note: Optional[str] = None,
    ) -> Dict:
        cert = (
            db.query(VerificationCertificate)
            .options(joinedload(VerificationCertificate.instrument))
            .filter(VerificationCertificate.id == certificate_id)
            .first()
        )
        if not cert:
            raise HTTPException(status_code=404, detail="Certificate not found")

        days = _days_until_expiry(cert.valid_until)
        reminder_window = 90 if days > 30 else 30 if days > 7 else 7

        payload = {
            "certificate_number": cert.certificate_number,
            "owner_name": cert.instrument.owner_name if cert.instrument else "User",
            "days_until_expiry": days,
            "reminder_window_days": reminder_window,
            "channels": channels,
            "note": note,
            "dispatched_at": datetime.utcnow().isoformat(),
        }

        AuditService.log_event(
            db=db,
            action="RENEWAL_REMINDER_TRIGGERED",
            entity_type="VerificationCertificate",
            entity_id=cert.certificate_number,
            user_id=str(actor.id),
            user_role=actor.role.value if hasattr(actor.role, "value") else str(actor.role),
            new_value=payload,
        )
        db.commit()
        return payload

    @staticmethod
    def create_prefilled_renewal_application(db: Session, certificate_id: int, actor: User) -> Dict:
        cert = (
            db.query(VerificationCertificate)
            .options(
                joinedload(VerificationCertificate.instrument),
                joinedload(VerificationCertificate.application),
            )
            .filter(VerificationCertificate.id == certificate_id)
            .first()
        )
        if not cert:
            raise HTTPException(status_code=404, detail="Certificate not found")

        existing = _latest_renewal_app(db, cert.instrument_id)
        if existing and existing.status not in _TERMINAL_APPLICATION_STATUSES:
            return {
                "application_id": existing.id,
                "application_number": existing.application_id,
                "status": existing.status.value,
                "idempotent": True,
            }

        count = db.query(Application).count() + 1
        app_number = f"LM-APP-{datetime.utcnow().year}-{str(count).zfill(4)}"
        inst = cert.instrument

        renewal = Application(
            application_id=app_number,
            instrument_id=cert.instrument_id,
            applicant_id=actor.id,
            application_type=ApplicationTypeEnum.RE_VERIFICATION,
            status=ApplicationStatusEnum.SUBMITTED,
            is_premises_verification=True,
            advance_notice_days=30,
            jurisdiction_id=inst.jurisdiction_id if inst else None,
            jurisdiction_status=cert.application.jurisdiction_status if cert.application else None,
            jurisdiction_notes=f"Auto-created renewal from certificate {cert.certificate_number}",
            priority="HIGH" if _days_until_expiry(cert.valid_until) <= 30 else "NORMAL",
            notes=(
                f"Renewal prefilled from previous certificate {cert.certificate_number}. "
                f"Previous verification date: {cert.verification_date.strftime('%Y-%m-%d')}."
            ),
            submitted_at=datetime.utcnow(),
        )
        db.add(renewal)
        db.flush()

        AuditService.log_event(
            db=db,
            action="RENEWAL_APPLICATION_CREATED",
            entity_type="Application",
            entity_id=renewal.application_id,
            user_id=str(actor.id),
            user_role=actor.role.value if hasattr(actor.role, "value") else str(actor.role),
            new_value={"certificate_number": cert.certificate_number, "instrument_id": cert.instrument_id},
        )
        db.commit()
        db.refresh(renewal)
        return {
            "application_id": renewal.id,
            "application_number": renewal.application_id,
            "status": renewal.status.value,
            "idempotent": False,
        }

    @staticmethod
    def renewal_metrics(db: Session, window_days: int = 90) -> Dict:
        queue = RenewalService.list_renewal_candidates(db=db, window_days=window_days, page=1, page_size=10_000)
        items = queue["items"]

        due_90 = len([i for i in items if 0 <= i["days_until_expiry"] <= 90])
        due_30 = len([i for i in items if 0 <= i["days_until_expiry"] <= 30])
        due_7 = len([i for i in items if 0 <= i["days_until_expiry"] <= 7])
        overdue = len([i for i in items if i["days_until_expiry"] < 0])
        avg_days = round(sum(i["days_until_expiry"] for i in items) / len(items), 2) if items else 0.0

        open_renewals = (
            db.query(Application)
            .filter(
                Application.application_type == ApplicationTypeEnum.RE_VERIFICATION,
                Application.status.notin_(list(_TERMINAL_APPLICATION_STATUSES)),
            )
            .count()
        )

        return {
            "total_due_within_window": len(items),
            "overdue_count": overdue,
            "due_in_90_days": due_90,
            "due_in_30_days": due_30,
            "due_in_7_days": due_7,
            "open_renewal_applications": open_renewals,
            "avg_days_to_expiry": avg_days,
        }
