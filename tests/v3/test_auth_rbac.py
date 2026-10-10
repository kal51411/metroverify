import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.v3_auth_service import hash_password, verify_password, create_access_token, verify_access_token

client = TestClient(app)

def test_v3_password_hashing():
    raw = "MetrologyPass2026!"
    hashed = hash_password(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_v3_jwt_lifecycle():
    token = create_access_token({"sub": "test_officer", "role": "INSPECTOR"})
    payload = verify_access_token(token)
    assert payload is not None
    assert payload["sub"] == "test_officer"
    assert payload["role"] == "INSPECTOR"

def test_v3_auth_registration_and_login():
    reg_payload = {
        "username": "rbac_inspector_unique_1",
        "email": "inspector_unique_1@metroverify.gov.in",
        "full_name": "Senior Inspector Deshmukh",
        "password": "SecurePassword123!",
        "role": "INSPECTOR",
        "designation": "Assistant Controller",
        "department": "Legal Metrology Dept"
    }
    res = client.post("/api/v3/auth/register", json=reg_payload)
    assert res.status_code in (201, 400) # 400 if already exists

    login_res = client.post("/api/v3/auth/login", json={
        "username": "rbac_inspector_unique_1",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "rbac_inspector_unique_1"
    assert data["user"]["role"] == "INSPECTOR"

    # Test /me endpoint with Bearer token
    me_res = client.get("/api/v3/auth/me", headers={
        "Authorization": f"Bearer {data['access_token']}"
    })
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "rbac_inspector_unique_1"

def test_v3_rbac_applicant_cannot_access_inspector_route():
    # Register an APPLICANT
    reg_applicant = {
        "username": "rbac_applicant_user_1",
        "email": "applicant_user_1@traders.in",
        "full_name": "Commercial Trader",
        "password": "ApplicantPass123!",
        "role": "APPLICANT"
    }
    client.post("/api/v3/auth/register", json=reg_applicant)

    login_res = client.post("/api/v3/auth/login", json={
        "username": "rbac_applicant_user_1",
        "password": "ApplicantPass123!"
    })
    applicant_token = login_res.json()["access_token"]

    # Attempt to execute inspection using Applicant token -> Expect 403 Forbidden
    inspection_payload = {
        "application_id": 1,
        "instrument_id": 1,
        "verification_mode": "INITIAL",
        "geo": {"latitude": 18.5204, "longitude": 73.8567},
        "inspection_address": "Pune Market Yard",
        "checklist": [{"key": "stamping", "label": "Stamping Plate", "passed": True}],
        "measurements": []
    }
    res = client.post(
        "/api/v3/inspections/execute",
        json=inspection_payload,
        headers={"Authorization": f"Bearer {applicant_token}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]
