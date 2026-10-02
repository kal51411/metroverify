from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class MessageResponse(BaseModel):
    message: str
    status: Optional[str] = None
    details: Optional[Any] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
