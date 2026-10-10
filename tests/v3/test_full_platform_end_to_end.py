import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.instruments import Instrument, AccuracyClassEnum, InstrumentStatusEnum
from app.models.applications import Application, ApplicationStatusEnum, ApplicationTypeEnum
from app.models.gatc import GATCCentre
from app.models.alerts import ValidityAlert, AlertSeverityEnum, AlertStatusEnum
from app.services.v3_auth_service import create_access_token

client = TestClient(app)
_token = create_access_token({"sub": "admin", "role": "ADMIN"})
client.headers.update({"Authorization": f"Bearer {_token}"})

def test_gatc_centres_api():
    res = client.get("/api/gatc/centres")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any("Western Maharashtra" in c["name"] or "GATC" in c["gatc_id"] for c in data)

def test_validity_alerts_lifecycle():
    # 1. Trigger scan
    gen_res = client.post("/api/alerts/generate")
    assert gen_res.status_code == 200
    assert gen_res.json()["status"] == "SUCCESS"

    # 2. List alerts
    list_res = client.get("/api/alerts")
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

    first_alert = alerts[0]
    alert_id = first_alert["id"]

    # 3. Acknowledge alert
    ack_res = client.patch(f"/api/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["state"] == "ACKNOWLEDGED"

    # 4. 1-Click Renewal
    renew_res = client.post(f"/api/alerts/{alert_id}/renew?applicant_id=1")
    assert renew_res.status_code == 200
    renew_data = renew_res.json()
    assert renew_data["status"] in ("SUCCESS", "ALREADY_SUBMITTED")
    assert "application_id" in renew_data

def test_application_allocation_to_gatc_and_lmo():
    import uuid
    db = SessionLocal()
    # Create test application
    inst = db.query(Instrument).first()
    unique_code = f"LM-APP-TEST-ALLOC-{uuid.uuid4().hex[:6].upper()}"
    app_rec = Application(
        application_id=unique_code,
        instrument_id=inst.id,
        applicant_id=1,
        application_type=ApplicationTypeEnum.NEW_VERIFICATION,
        status=ApplicationStatusEnum.SUBMITTED
    )
    db.add(app_rec)
    db.commit()
    db.refresh(app_rec)
    app_id = app_rec.id
    db.close()

    # Allocate to GATC
    alloc_gatc = client.patch(
        f"/api/applications/{app_id}/allocate",
        json={
            "allocation_target": "GATC",
            "gatc_id": 1,
            "scheduled_date": "2026-10-25",
            "scheduled_time": "11:00 AM",
            "priority": "HIGH",
            "notes": "Allocated to Western Maharashtra GATC for heavy load verification"
        }
    )
    assert alloc_gatc.status_code == 200
    assert alloc_gatc.json()["status"] == "SCHEDULED"

    # Check GATC queue
    queue_res = client.get("/api/gatc/my-queue?gatc_id=1")
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    assert any(a["id"] == app_id for a in queue_data)

def test_universal_repository_search():
    res = client.get("/api/repository/search?query=SYNTH")
    assert res.status_code == 200
    data = res.json()
    assert data["match_count"] >= 1
    assert "certificates" in data
    assert "instruments" in data

    # Export CSV
    export_csv = client.get("/api/repository/export?format=csv")
    assert export_csv.status_code == 200
    assert "text/csv" in export_csv.headers["content-type"]

def test_public_verify_lookup():
    # Verify lookup with certificate or serial
    res = client.get("/api/verify/lookup?query=LM-CERT-2026-001")
    assert res.status_code == 200
    data = res.json()
    assert "is_valid" in data
    assert "status" in data
    assert "certificate_number" in data
