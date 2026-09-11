from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine
from models import Base
from routers import instruments, applications, inspections, certificates, verify

# Create tables
Base.metadata.create_all(bind=engine)

# Auto-seed
from database import SessionLocal
from seed import seed_database

db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="MetroVerify API",
    description="Legal Metrology Verification System API",
    version="1.0.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(instruments.router)
app.include_router(applications.router)
app.include_router(inspections.router)
app.include_router(certificates.router)
app.include_router(verify.router)


@app.get("/")
def root():
    return {"message": "MetroVerify API", "version": "1.0.0", "status": "operational"}


@app.get("/health")
def health():
    return {"status": "healthy"}
