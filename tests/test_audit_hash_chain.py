import pytest
from app.services.audit_service import AuditService
from app.models.audit import AuditEvent

def test_audit_hash_chain_integrity(db_session):
    db = db_session
    # Clear audit events for test
    db.query(AuditEvent).delete()
    db.commit()
    
    # Log series of events
    e1 = AuditService.log_event(db, "APP_SUBMITTED", "Application", "APP-1", user_id="1", new_value={"status": "SUBMITTED"})
    e2 = AuditService.log_event(db, "APP_APPROVED", "Application", "APP-1", user_id="2", new_value={"status": "APPROVED"})
    e3 = AuditService.log_event(db, "INSPECTION_COMPLETED", "Inspection", "INSP-1", user_id="2", new_value={"result": "PASS"})
    db.commit()
    
    # Verify chain
    res = AuditService.verify_chain(db)
    assert res["is_valid"] is True
    assert res["total_events"] == 3
    assert res["broken_event_id"] is None
    
    # Tamper test: modify e2 value directly
    e2_row = db.query(AuditEvent).filter(AuditEvent.id == e2.id).first()
    e2_row.new_value = "{\"status\": \"TAMPERED\"}"
    db.commit()
    
    tampered_res = AuditService.verify_chain(db)
    assert tampered_res["is_valid"] is False
    assert tampered_res["broken_event_id"] == e2_row.event_id
