from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class RenewalReminderRequest(BaseModel):
    channels: List[Literal["EMAIL", "SMS", "WHATSAPP"]] = ["EMAIL"]
    note: Optional[str] = None


class RenewalQueueItem(BaseModel):
    certificate_id: int
    certificate_number: str
    valid_until: datetime
    days_until_expiry: int
    sla_bucket: str
    owner_name: str
    business_name: str
    instrument_id: str
    instrument_type: str
    serial_number: str
    district: str
    latest_application_status: Optional[str] = None
    renewal_application_id: Optional[str] = None


class RenewalQueueResponse(BaseModel):
    items: List[RenewalQueueItem]
    total: int
    page: int
    page_size: int


class RenewalMetricsResponse(BaseModel):
    total_due_within_window: int
    overdue_count: int
    due_in_90_days: int
    due_in_30_days: int
    due_in_7_days: int
    open_renewal_applications: int
    avg_days_to_expiry: float
