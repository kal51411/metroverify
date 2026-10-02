from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Jurisdiction(Base):
    __tablename__ = "jurisdictions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    state = Column(String(100), default="Maharashtra", nullable=False)
    division = Column(String(100), nullable=False, index=True) # e.g., Mumbai, Pune, Nashik, Konkan, etc.
    district = Column(String(100), nullable=False, index=True) # e.g., Mumbai City, Pune, Thane
    taluka = Column(String(100), nullable=True)
    office_name = Column(String(200), nullable=False)
    office_address = Column(Text, nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    instruments = relationship("Instrument", back_populates="jurisdiction")
    applications = relationship("Application", back_populates="jurisdiction")

class Office(Base):
    __tablename__ = "offices"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    division = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    officer_in_charge = Column(String(200), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
