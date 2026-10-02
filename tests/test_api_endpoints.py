import pytest

def test_root_and_health(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["system"] == "MetroVerify v2"
    assert data["status"] == "OPERATIONAL"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_rulesets_mpe_api(client):
    # Class III at 50 kg, e = 0.05 kg
    res = client.get("/api/rulesets/mpe/calculate?load=50.0&e=0.05&accuracy_class=CLASS_III")
    assert res.status_code == 200
    data = res.json()
    assert data["mpe_value"] == 0.05
    assert data["mpe_factor_in_e"] == 1.0

def test_rulesets_high_capacity_api(client):
    # 60,000 kg, e = 20 kg, repeatability readings range = 3 kg (<= 0.2e)
    res = client.get("/api/rulesets/high-capacity/substitution?max_capacity=60000.0&e=20.0&r1=30000&r2=30003&r3=30001")
    assert res.status_code == 200
    data = res.json()
    assert data["eligibility"] == "ELIGIBLE_ONE_FIFTH"
    assert data["required_standard_load"] == 12000.0

def test_list_instruments_and_standards(client):
    inst_res = client.get("/api/instruments")
    assert inst_res.status_code == 200
    assert isinstance(inst_res.json(), list)

    std_res = client.get("/api/standards")
    assert std_res.status_code == 200
    assert isinstance(std_res.json(), list)

def test_audit_verify_chain_api(client):
    res = client.get("/api/audit/verify-chain")
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
