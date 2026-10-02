import hashlib
import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(String(100), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(100), nullable=False, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    
    previous_event_hash = Column(String(64), nullable=True)
    event_hash = Column(String(64), nullable=False)
    
    @staticmethod
    def calculate_hash(prev_hash: str, event_id: str, timestamp_str: str, action: str, entity_type: str, entity_id: str, new_value: str) -> str:
        prev = prev_hash if prev_hash else "GENESIS"
        val = new_value if new_value else ""
        payload = f"{prev}:{event_id}:{timestamp_str}:{action}:{entity_type}:{entity_id}:{val}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()
