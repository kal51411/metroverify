from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
import shutil

from app.database import get_db
from app.models.applications import (
    Application, ApplicationDocument, PaymentRecord, QueryRecord,
    ApplicationStatusEnum, ApplicationTypeEnum, JurisdictionStatusEnum,
    DocumentStatusEnum, DocumentTypeEnum
)
from app.models.instruments import Instrument, InstrumentStatusEnum
from app.models.users import User, RoleEnum
from app.models.jurisdictions import Jurisdiction
from app.schemas.applications import (
    ApplicationCreate, ApplicationOut, ScheduleRequest, RejectRequest,
    QueryCreateRequest, QueryRespondRequest, PaymentCreateRequest, AllocateRequest
)
from app.rules.jurisdictions import validate_application_jurisdiction
from app.services.audit_service import AuditService
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/api/applications", tags=["applications"])

_ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
_ALLOWED_UPLOAD_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024


def _ensure_upload_policy(file_name: str, mime_type: str, raw_bytes: bytes):
    ext = os.path.splitext(file_name or "")[1].lower()
    if ext not in _ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")
    if (mime_type or "").lower() not in _ALLOWED_UPLOAD_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file MIME type")
    if len(raw_bytes) > _MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file is too large")

@router.get("", response_model=List[ApplicationOut])
def list_applications(
    status: Optional[str] = None,
    applicant_id: Optional[int] = None,
    inspector_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.documents),
        joinedload(Application.payments),
        joinedload(Application.queries)
    )
    if status and status != "ALL":
        q = q.filter(Application.status == status)
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == RoleEnum.APPLICANT.value:
        q = q.filter(Application.applicant_id == current_user.id)
    elif applicant_id:
        q = q.filter(Application.applicant_id == applicant_id)
    if user_role == RoleEnum.INSPECTOR.value:
        q = q.filter(Application.assigned_inspector_id == current_user.id)
    elif inspector_id:
        q = q.filter(Application.assigned_inspector_id == inspector_id)
    return [ApplicationOut.model_validate(a) for a in q.order_by(Application.submitted_at.desc()).all()]

@router.get("/stats/summary")
def get_applications_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.models.certificates import VerificationCertificate
    now = datetime.utcnow()
    total_inst = db.query(Instrument).count()
    total_apps = db.query(Application).count()
    pending_review = db.query(Application).filter(Application.status.in_([ApplicationStatusEnum.SUBMITTED, ApplicationStatusEnum.UNDER_REVIEW])).count()
    scheduled = db.query(Application).filter(Application.status == ApplicationStatusEnum.SCHEDULED).count()
    under_inspection = db.query(Application).filter(Application.status == ApplicationStatusEnum.UNDER_INSPECTION).count()
    passed = db.query(Application).filter(Application.status.in_([ApplicationStatusEnum.INSPECTION_PASSED, ApplicationStatusEnum.CERTIFICATE_ISSUED, ApplicationStatusEnum.ACTIVE])).count()
    failed = db.query(Application).filter(Application.status.in_([ApplicationStatusEnum.INSPECTION_FAILED, ApplicationStatusEnum.REJECTED])).count()
    
    soon = now + timedelta(days=90)
    expiring_soon = db.query(VerificationCertificate).filter(
        VerificationCertificate.valid_until <= soon,
        VerificationCertificate.valid_until >= now
    ).count()
    
    return {
        "total_instruments": total_inst,
        "total_applications": total_apps,
        "pending_review": pending_review,
        "scheduled": scheduled,
        "under_inspection": under_inspection,
        "passed": passed,
        "failed": failed,
        "expiring_soon": expiring_soon
    }

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).options(
        joinedload(Application.instrument),
        joinedload(Application.documents),
        joinedload(Application.payments),
        joinedload(Application.queries)
    ).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == RoleEnum.APPLICANT.value and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own applications")
    if user_role == RoleEnum.INSPECTOR.value and app.assigned_inspector_id not in (None, current_user.id):
        raise HTTPException(status_code=403, detail="You are not assigned to this application")
    return ApplicationOut.model_validate(app)

@router.post("", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    inst = db.query(Instrument).filter(Instrument.id == payload.instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
        
    count = db.query(Application).count() + 1
    app_id = f"LM-APP-{datetime.utcnow().year}-{str(count).zfill(4)}"
    
    # Jurisdiction scrutiny
    jur_check = validate_application_jurisdiction(inst.district, inst.division)
    jur_status = JurisdictionStatusEnum(jur_check["jurisdiction_status"])
    
    jur = db.query(Jurisdiction).filter(Jurisdiction.district.ilike(inst.district.strip())).first()
    jur_id = jur.id if jur else None
    
    app = Application(
        application_id=app_id,
        instrument_id=inst.id,
        applicant_id=current_user.id,
        application_type=payload.application_type,
        status=ApplicationStatusEnum.SUBMITTED,
        is_premises_verification=payload.is_premises_verification,
        advance_notice_days=payload.advance_notice_days,
        jurisdiction_id=jur_id,
        jurisdiction_status=jur_status,
        jurisdiction_notes=jur_check["notes"],
        priority=payload.priority,
        notes=payload.notes,
        submitted_at=datetime.utcnow()
    )
    db.add(app)
    db.flush()
    
    inst.status = InstrumentStatusEnum.PENDING_VERIFICATION
    
    AuditService.log_event(
        db=db,
        action="APPLICATION_SUBMITTED",
        entity_type="Application",
        entity_id=app_id,
        user_id=str(current_user.id),
        user_role="APPLICANT",
        new_value={"type": payload.application_type.value, "premises": payload.is_premises_verification}
    )
    
    db.commit()
    db.refresh(app)
    return ApplicationOut.model_validate(app)

@router.post("/{application_id}/documents")
async def upload_document(
    application_id: int,
    document_type: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    os.makedirs("uploads", exist_ok=True)
    safe_name = os.path.basename(file.filename or "document.pdf")
    content = await file.read()
    _ensure_upload_policy(safe_name, file.content_type or "", content)
    file_ext = os.path.splitext(safe_name)[1]
    saved_filename = f"doc_{uuid.uuid4().hex[:10]}{file_ext}"
    saved_path = os.path.join("uploads", saved_filename)
    
    with open(saved_path, "wb") as buffer:
        buffer.write(content)
        
    file_size = os.path.getsize(saved_path)
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    
    doc = ApplicationDocument(
        document_id=doc_id,
        application_id=app.id,
        document_type=DocumentTypeEnum(document_type),
        title=title,
        file_path=saved_path,
        file_name=safe_name,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        status=DocumentStatusEnum.UPLOADED,
        uploaded_at=datetime.utcnow()
    )
    db.add(doc)
    
    AuditService.log_event(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity_type="ApplicationDocument",
        entity_id=doc_id,
        user_id=str(current_user.id),
        user_role="APPLICANT",
        new_value={"doc_type": document_type, "file": safe_name}
    )
    
    db.commit()
    return {"message": "Document uploaded successfully", "document_id": doc_id}

@router.patch("/{application_id}/documents/{document_id}/verify")
def verify_document(
    application_id: int,
    document_id: str,
    action: str = "ACCEPT", # ACCEPT, REJECT
    rejection_reason: Optional[str] = None,
    officer_name: str = "Inspector Legal Metrology",
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == application_id,
        ApplicationDocument.document_id == document_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if action == "ACCEPT":
        doc.status = DocumentStatusEnum.ACCEPTED
        doc.verified_at = datetime.utcnow()
        doc.verified_by = officer_name
    else:
        doc.status = DocumentStatusEnum.REJECTED
        doc.rejection_reason = rejection_reason or "Document deficient or illegible."
        doc.verified_at = datetime.utcnow()
        doc.verified_by = officer_name
        
    AuditService.log_event(
        db=db,
        action=f"DOCUMENT_{doc.status.value}",
        entity_type="ApplicationDocument",
        entity_id=doc.document_id,
        user_role="INSPECTOR",
        new_value={"status": doc.status.value, "reason": rejection_reason}
    )
    
    db.commit()
    return {"message": f"Document {doc.status.value}", "status": doc.status.value}

@router.post("/{application_id}/payments")
def record_payment(
    application_id: int,
    payload: PaymentCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    pay_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
    payment = PaymentRecord(
        payment_id=pay_id,
        application_id=app.id,
        challan_number=payload.challan_number,
        gras_grn=payload.gras_grn,
        scroll_number=payload.scroll_number,
        amount=payload.amount,
        payment_date=datetime.utcnow(),
        payment_status="VERIFIED",
        fee_breakdown="Statutory Verification Fee (GRAS Verified)"
    )
    db.add(payment)
    
    AuditService.log_event(
        db=db,
        action="PAYMENT_RECORDED",
        entity_type="PaymentRecord",
        entity_id=pay_id,
        new_value={"amount": payload.amount, "challan": payload.challan_number, "grn": payload.gras_grn}
    )
    
    db.commit()
    return {"message": "Payment recorded successfully", "payment_id": pay_id}

@router.post("/{application_id}/queries")
def raise_query(
    application_id: int,
    payload: QueryCreateRequest,
    officer_name: str = "Assistant Controller Legal Metrology",
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.INSPECTOR, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    qid = f"QRY-{uuid.uuid4().hex[:6].upper()}"
    q = QueryRecord(
        query_id=qid,
        application_id=app.id,
        query_text=payload.query_text,
        raised_by=officer_name,
        raised_at=datetime.utcnow(),
        status="OPEN"
    )
    db.add(q)
    app.status = ApplicationStatusEnum.QUERY_RAISED
    
    AuditService.log_event(
        db=db,
        action="QUERY_RAISED",
        entity_type="QueryRecord",
        entity_id=qid,
        user_role="INSPECTOR",
        new_value={"query": payload.query_text}
    )
    
    db.commit()
    return {"message": "Deficiency query raised", "query_id": qid}

@router.patch("/{application_id}/queries/{query_id}/respond")
def respond_query(
    application_id: int,
    query_id: str,
    payload: QueryRespondRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.APPLICANT, RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    q = db.query(QueryRecord).filter(
        QueryRecord.application_id == application_id,
        QueryRecord.query_id == query_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
        
    q.response_text = payload.response_text
    q.responded_at = datetime.utcnow()
    q.status = "RESOLVED"
    
    app = db.query(Application).filter(Application.id == application_id).first()
    if app:
        app.status = ApplicationStatusEnum.QUERY_RESPONDED
        
    AuditService.log_event(
        db=db,
        action="QUERY_RESPONDED",
        entity_type="QueryRecord",
        entity_id=query_id,
        user_role="APPLICANT",
        new_value={"response": payload.response_text}
    )
    
    db.commit()
    return {"message": "Query response submitted", "status": "RESOLVED"}

@router.patch("/{application_id}/approve")
def approve_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.status == ApplicationStatusEnum.APPROVED:
        return {"message": "Application already approved", "status": app.status.value}

    if app.status not in (
        ApplicationStatusEnum.SUBMITTED,
        ApplicationStatusEnum.UNDER_REVIEW,
        ApplicationStatusEnum.QUERY_RESPONDED,
    ):
        raise HTTPException(status_code=400, detail=f"Cannot approve application in status {app.status.value}")

    if app.jurisdiction_status == JurisdictionStatusEnum.WRONG_JURISDICTION:
        raise HTTPException(status_code=400, detail="Cannot approve application in WRONG_JURISDICTION status.")
        
    app.status = ApplicationStatusEnum.APPROVED
    app.reviewed_at = datetime.utcnow()
    
    AuditService.log_event(
        db=db,
        action="APPLICATION_APPROVED",
        entity_type="Application",
        entity_id=app.application_id,
        user_id=str(current_user.id),
        user_role="SUPERVISOR",
        new_value={"status": "APPROVED"}
    )
    
    db.commit()
    return {"message": "Application approved for scheduling", "status": app.status.value}

@router.patch("/{application_id}/reject")
def reject_application(
    application_id: int,
    payload: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.status == ApplicationStatusEnum.REJECTED:
        return {"message": "Application already rejected", "status": app.status.value}

    if app.status in (ApplicationStatusEnum.CERTIFICATE_ISSUED, ApplicationStatusEnum.ACTIVE):
        raise HTTPException(status_code=400, detail=f"Cannot reject application in status {app.status.value}")

    app.status = ApplicationStatusEnum.REJECTED
    app.reviewed_at = datetime.utcnow()
    app.notes = f"Rejected: {payload.reason}"
    
    AuditService.log_event(
        db=db,
        action="APPLICATION_REJECTED",
        entity_type="Application",
        entity_id=app.application_id,
        user_id=str(current_user.id),
        user_role="SUPERVISOR",
        reason=payload.reason
    )
    
    db.commit()
    return {"message": "Application rejected", "status": app.status.value}

@router.patch("/{application_id}/schedule")
def schedule_application(
    application_id: int,
    payload: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.SUPERVISOR, RoleEnum.ADMIN))
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.status == ApplicationStatusEnum.SCHEDULED and (
        app.assigned_inspector_id == payload.inspector_id
        and app.scheduled_date == payload.scheduled_date
        and app.scheduled_time == payload.scheduled_time
        and app.test_centre_or_premises == payload.test_centre_or_premises
    ):
        return {"message": "Inspection already scheduled with same details", "status": app.status.value}

    if app.status not in (
        ApplicationStatusEnum.APPROVED,
        ApplicationStatusEnum.SCHEDULED,
        ApplicationStatusEnum.UNDER_REVIEW,
        ApplicationStatusEnum.QUERY_RESPONDED,
    ):
        raise HTTPException(status_code=400, detail=f"Cannot schedule application in status {app.status.value}")
        
    app.status = ApplicationStatusEnum.SCHEDULED
    app.assigned_inspector_id = payload.inspector_id
    app.scheduled_date = payload.scheduled_date
    app.scheduled_time = payload.scheduled_time
    app.test_centre_or_premises = payload.test_centre_or_premises
    app.scheduled_at = datetime.utcnow()
    if payload.notes:
        app.notes = payload.notes
        
    AuditService.log_event(
        db=db,
        action="INSPECTION_SCHEDULED",
        entity_type="Application",
        entity_id=app.application_id,
        user_id=str(current_user.id),
        user_role="SUPERVISOR",
        new_value={
            "date": payload.scheduled_date,
            "time": payload.scheduled_time,
            "inspector_id": payload.inspector_id,
            "location": payload.test_centre_or_premises
        }
    )
    
    db.commit()
    return {"message": "Inspection scheduled successfully", "status": app.status.value}

@router.patch("/{application_id}/allocate")
def allocate_application(
    application_id: int,
    payload: AllocateRequest,
    allocator_id: int = 2,
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.allocation_target = payload.allocation_target
    if payload.allocation_target == "GATC":
        app.assigned_gatc_id = payload.gatc_id
    else:
        app.assigned_inspector_id = payload.inspector_id

    if payload.scheduled_date:
        app.scheduled_date = payload.scheduled_date
    if payload.scheduled_time:
        app.scheduled_time = payload.scheduled_time
    if payload.test_centre_or_premises:
        app.test_centre_or_premises = payload.test_centre_or_premises
    if payload.priority:
        app.priority = payload.priority
    if payload.notes:
        app.notes = payload.notes

    app.status = ApplicationStatusEnum.SCHEDULED
    app.scheduled_at = datetime.utcnow()

    AuditService.log_event(
        db=db,
        action="APPLICATION_ALLOCATED",
        entity_type="Application",
        entity_id=app.application_id,
        user_id=str(allocator_id),
        user_role="SUPERVISOR",
        new_value={
            "target": payload.allocation_target,
            "inspector_id": payload.inspector_id,
            "gatc_id": payload.gatc_id,
            "date": payload.scheduled_date
        }
    )

    db.commit()
    db.refresh(app)
    return {"message": f"Application allocated to {payload.allocation_target} successfully", "status": app.status.value}
