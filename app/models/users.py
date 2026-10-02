import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class RoleEnum(str, enum.Enum):
    APPLICANT = "APPLICANT"
    INSPECTOR = "INSPECTOR"
    SUPERVISOR = "SUPERVISOR"
    ADMIN = "ADMIN"
    PUBLIC_VERIFIER = "PUBLIC_VERIFIER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.APPLICANT, nullable=False)
    designation = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    jurisdiction_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    applications = relationship("Application", back_populates="applicant", foreign_keys="Application.applicant_id")
    assigned_inspections = relationship("Inspection", back_populates="inspector", foreign_keys="Inspection.inspector_id")
