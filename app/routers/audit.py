from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.audit import AuditEvent
from app.schemas.audit import AuditEventOut, AuditChainVerifyResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("", response_model=List[AuditEventOut])
def list_audit_events(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(AuditEvent)
    if action:
        q = q.filter(AuditEvent.action == action)
    if entity_type:
        q = q.filter(AuditEvent.entity_type == entity_type)
    return [AuditEventOut.model_validate(e) for e in q.order_by(AuditEvent.id.desc()).limit(limit).all()]

@router.get("/verify-chain", response_model=AuditChainVerifyResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    res = AuditService.verify_chain(db)
    return AuditChainVerifyResponse(**res)
