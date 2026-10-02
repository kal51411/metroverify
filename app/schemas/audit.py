from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditEventOut(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    previous_event_hash: Optional[str] = None
    event_hash: str

    class Config:
        from_attributes = True

class AuditChainVerifyResponse(BaseModel):
    total_events: int
    is_valid: bool
    broken_event_id: Optional[str] = None
    message: str
