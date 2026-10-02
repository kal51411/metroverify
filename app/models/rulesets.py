import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from app.database import Base

class Ruleset(Base):
    __tablename__ = "rulesets"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    source_document = Column(String(255), nullable=False)
    section_reference = Column(String(255), nullable=True)
    version = Column(String(50), nullable=False)
    effective_from = Column(DateTime, nullable=False)
    effective_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MPEBand(Base):
    __tablename__ = "mpe_bands"
    
    id = Column(Integer, primary_key=True, index=True)
    ruleset_code = Column(String(100), index=True, nullable=False)
    accuracy_class = Column(String(50), nullable=False) # CLASS_I, CLASS_II, CLASS_III, CLASS_IIII
    verification_mode = Column(String(50), default="INITIAL", nullable=False) # INITIAL, REVERIFICATION, SERVICE
    lower_interval_limit = Column(Float, nullable=False) # in multiples of e, e.g., 0
    upper_interval_limit = Column(Float, nullable=True)  # in multiples of e, e.g., 500 (None for infinity)
    mpe_factor_e = Column(Float, nullable=False)        # e.g., 0.5, 1.0, 1.5
    created_at = Column(DateTime, default=datetime.utcnow)

class FeeRule(Base):
    __tablename__ = "fee_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    fee_schedule_code = Column(String(100), index=True, nullable=False) # e.g. MH_LM_FEE_2018
    instrument_type = Column(String(100), nullable=False)
    accuracy_class = Column(String(50), nullable=True)
    min_capacity = Column(Float, nullable=False)
    max_capacity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg", nullable=False)
    base_fee = Column(Float, nullable=False) # in INR
    additional_fee_rule = Column(String(255), nullable=True) # e.g., Premises verification fee
    effective_from = Column(DateTime, nullable=False)
    effective_until = Column(DateTime, nullable=True)
    source_notification = Column(String(255), default="Maharashtra LM Fee Notification 20-04-2018", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class VerificationIntervalRule(Base):
    __tablename__ = "verification_interval_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(100), index=True, nullable=False)
    instrument_category = Column(String(100), nullable=False)
    instrument_type = Column(String(100), nullable=False)
    interval_months = Column(Integer, nullable=False) # 12 or 24 months
    effective_from = Column(DateTime, nullable=False)
    effective_until = Column(DateTime, nullable=True)
    source_reference = Column(String(255), nullable=False)
    rule_version = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
