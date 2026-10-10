import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, SessionLocal
from app.models import Base
from app.routers import (
    auth, instruments, applications, inspections,
    standards, certificates, verify, rulesets,
    diagnostics, audit, v3_auth, v3_ai, v3_telemetry,
    v3_inspections
)
from app.services.seed_service import seed_database

# Create tables if not existing
Base.metadata.create_all(bind=engine)

# Seed ONLY if explicit setting SEED_DEMO_DATA=True
if settings.SEED_DEMO_DATA:
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

app = FastAPI(
    title="MetroVerify API",
    description="Legal Metrology Digital Verification & Audit Ledger Platform",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/evidence", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include all modular routers (preserving all v1/v2 routes)
app.include_router(auth.router)
app.include_router(instruments.router)
app.include_router(applications.router)
app.include_router(inspections.router)
app.include_router(standards.router)
app.include_router(certificates.router)
app.include_router(verify.router)
app.include_router(rulesets.router)
app.include_router(diagnostics.router)
app.include_router(audit.router)

# v3 Enhanced Routers
app.include_router(v3_auth.router)
app.include_router(v3_ai.router)
app.include_router(v3_telemetry.router)
app.include_router(v3_inspections.router)

@app.get("/")
def root():
    return {
        "system": "MetroVerify v2",
        "status": "OPERATIONAL",
        "engine_version": "3.0.0",
        "ruleset": "Legal Metrology (General) Rules, 2011 (Amended 2025/2026)",
        "state_workflow": "Maharashtra Legal Metrology Enforcement Framework",
        "demo_mode": settings.SEED_DEMO_DATA
    }

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected"}
