import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.instruments import Instrument, AccuracyClassEnum, InstrumentStatusEnum
from app.models.applications import Application, ApplicationStatusEnum, ApplicationTypeEnum
from app.services.v3_auth_service import create_access_token

client = TestClient(app)

@pytest.fixture
def test_setup():
    db = SessionLocal()
    # Check if test instrument exists or create
    inst = db.query(Instrument).filter(Instrument.instrument_id == "INST-TEST-GEO-V3").first()
    if not inst:
        inst = Instrument(
            instrument_id="INST-TEST-GEO-V3",
            instrument_type="NON_AUTOMATIC_WEIGHING_INSTRUMENT",
            manufacturer="Precision Metrics India",
            model="PM-3000",
            serial_number="SN-GEO-V3-001",
            accuracy_class=AccuracyClassEnum.CLASS_III,
            max_capacity=150.0,
            min_capacity=1.0,
            verification_scale_interval_e=0.05,
            actual_scale_interval_d=0.01,
            unit="kg",
            owner_name="M/s Agro Commodities",
            business_name="Agro Weighing Hub",
            address="Market Yard, Sector 4",
            district="Pune",
            division="Pune",
            status=InstrumentStatusEnum.PENDING_VERIFICATION
        )
        db.add(inst)
        db.commit()
        db.refresh(inst)

    app_rec = db.query(Application).filter(Application.application_id == "APP-TEST-GEO-V3").first()
    if not app_rec:
        app_rec = Application(
            application_id="APP-TEST-GEO-V3",
            instrument_id=inst.id,
            applicant_id=1,
            application_type=ApplicationTypeEnum.NEW_VERIFICATION,
            status=ApplicationStatusEnum.SCHEDULED
        )
        db.add(app_rec)
        db.commit()
        db.refresh(app_rec)

    inst_id = inst.id
    app_id = app_rec.id
    db.close()
    return {"instrument_id": inst_id, "application_id": app_id}

def test_v3_execute_geo_inspection_pass(test_setup):
    # Obtain or generate valid Inspector Bearer token
    inspector_token = create_access_token({"sub": "admin", "role": "INSPECTOR"})

    payload = {
        "application_id": test_setup["application_id"],
        "instrument_id": test_setup["instrument_id"],
        "verification_mode": "INITIAL",
        "geo": {
            "latitude": 18.52043,
            "longitude": 73.85674,
            "accuracy_meters": 3.2
        },
        "inspection_address": "Pune Central Mandi, Sector 4",
        "checklist": [
            {"key": "stamping_plate", "label": "Model plate clearly readable", "passed": True},
            {"key": "lead_seal", "label": "Calibration port sealed", "passed": True},
            {"key": "leveling", "label": "Spirit level indicator centered", "passed": True}
        ],
        "measurements": [
            {
                "step_key": "indication_error",
                "load_target": 50.0,
                "standard_value": 50.0,
                "observed_value": 50.02,
                "error": 0.02,
                "mpe": 0.05,
                "within_mpe": True
            }
        ],
        "ambient_temperature_c": 26.5,
        "relative_humidity_pct": 52.0
    }

    res = client.post(
        "/api/v3/inspections/execute",
        json=payload,
        headers={"Authorization": f"Bearer {inspector_token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert "inspection_id" in data
    assert data["final_result"] == "PASS"
    assert data["status"] == "PASSED"
    assert "audit_hash" in data
    assert len(data["audit_hash"]) == 64 # SHA-256

    # Test retrieval of inspection
    get_res = client.get(
        f"/api/v3/inspections/{data['inspection_id']}",
        headers={"Authorization": f"Bearer {inspector_token}"}
    )
    assert get_res.status_code == 200
    assert get_res.json()["final_result"] == "PASS"
