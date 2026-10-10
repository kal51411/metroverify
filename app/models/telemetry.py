from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class TelemetryLog(Base):
    __tablename__ = "v3_telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    gross_weight = Column(Float, nullable=False)
    cell_1_weight = Column(Float, nullable=False)
    cell_2_weight = Column(Float, nullable=False)
    cell_3_weight = Column(Float, nullable=False)
    cell_4_weight = Column(Float, nullable=False)
    zero_drift = Column(Float, default=0.0)
    corner_imbalance = Column(Float, default=0.0)
    status = Column(String(20), default="NORMAL") # NORMAL, WARNING, CRITICAL
