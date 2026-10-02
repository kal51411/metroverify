import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent
from typing import Optional, Dict, Any

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: Optional[str] = "SYSTEM",
        user_role: Optional[str] = "SYSTEM",
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> AuditEvent:
        """
        Appends an immutable audit event to the hash-chained audit log.
        """
        last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_event.event_hash if last_event else "GENESIS_HASH_METROVERIFY_V2"
        
        event_id = f"AUD-{datetime.utcnow().strftime("%Y%m%d%H%M%S")}-{uuid.uuid4().hex[:6].upper()}"
        now = datetime.utcnow()
        now_str = now.isoformat()
        
        old_json = json.dumps(old_value, default=str) if old_value else None
        new_json = json.dumps(new_value, default=str) if new_value else None
        
        event_hash = AuditEvent.calculate_hash(
            prev_hash=prev_hash,
            event_id=event_id,
            timestamp_str=now_str,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            new_value=new_json or ""
        )
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=now,
            user_id=str(user_id) if user_id else "SYSTEM",
            user_role=str(user_role) if user_role else "SYSTEM",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            old_value=old_json,
            new_value=new_json,
            reason=reason,
            ip_address=ip_address,
            previous_event_hash=prev_hash,
            event_hash=event_hash
        )
        db.add(event)
        db.flush()
        return event

    @staticmethod
    def verify_chain(db: Session) -> Dict[str, Any]:
        """
        Validates entire audit trail hash chain to detect any tampering or deletion.
        """
        events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
        if not events:
            return {"total_events": 0, "is_valid": True, "message": "Audit trail is empty and valid."}
            
        prev_hash = "GENESIS_HASH_METROVERIFY_V2"
        for ev in events:
            if ev.previous_event_hash != prev_hash:
                return {
                    "total_events": len(events),
                    "is_valid": False,
                    "broken_event_id": ev.event_id,
                    "message": f"Hash chain broken at event {ev.event_id}: previous hash mismatch."
                }
            recomputed = AuditEvent.calculate_hash(
                prev_hash=prev_hash,
                event_id=ev.event_id,
                timestamp_str=ev.timestamp.isoformat(),
                action=ev.action,
                entity_type=ev.entity_type,
                entity_id=ev.entity_id,
                new_value=ev.new_value or ""
            )
            if recomputed != ev.event_hash:
                return {
                    "total_events": len(events),
                    "is_valid": False,
                    "broken_event_id": ev.event_id,
                    "message": f"Tamper detected at event {ev.event_id}: signature hash mismatch."
                }
            prev_hash = ev.event_hash
            
        return {
            "total_events": len(events),
            "is_valid": True,
            "broken_event_id": None,
            "message": f"Verified {len(events)} audit events. Cryptographic hash chain is intact."
        }
