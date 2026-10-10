from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class GATCCentre(Base):
    __tablename__ = "gatc_centres"

    id = Column(Integer, primary_key=True, index=True)
    gatc_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. GATC-MH-PUN-01
    name = Column(String(255), nullable=False)
    notification_number = Column(String(150), unique=True, nullable=False) # Govt notification under Section 14
    notification_date = Column(DateTime, nullable=True)
    accreditation_body = Column(String(100), default="NABL / RRSL", nullable=False)
    valid_until = Column(DateTime, nullable=False)
    authorized_signatory = Column(String(200), nullable=False)
    signatory_designation = Column(String(150), default="Director / Technical Head", nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    district = Column(String(100), nullable=False, index=True)
    division = Column(String(100), nullable=False, index=True)
    scope_of_testing = Column(Text, nullable=False) # e.g. "Weighbridges, Platform Scales Class II & III, Fuel Dispensers"
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    applications = relationship("Application", back_populates="assigned_gatc")
