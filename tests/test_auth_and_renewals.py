import pytest


def test_login_and_me_endpoint(client):
    login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token

    me = client.get("/api/auth/me", headers={"Authorization": "Bearer " + token})
    assert me.status_code == 200
    me_data = me.json()
    assert me_data["username"] == "admin"
    assert me_data["role"] == "ADMIN"


def test_renewal_queue_metrics_and_actions(client):
    queue = client.get("/api/certificates/renewals/queue?window_days=180&page=1&page_size=20")
    assert queue.status_code == 200
    data = queue.json()
    assert "items" in data
    assert "total" in data

    metrics = client.get("/api/certificates/renewals/metrics?window_days=180")
    assert metrics.status_code == 200
    metrics_data = metrics.json()
    assert "due_in_90_days" in metrics_data
    assert "open_renewal_applications" in metrics_data

    if not data["items"]:
        pytest.skip("No certificates in renewal window for this seed state")

    cert_id = data["items"][0]["certificate_id"]

    create = client.post(f"/api/certificates/{cert_id}/renewals")
    assert create.status_code == 200
    create_data = create.json()
    assert "application_number" in create_data

    create_again = client.post(f"/api/certificates/{cert_id}/renewals")
    assert create_again.status_code == 200
    assert create_again.json()["idempotent"] is True

    reminder = client.post(
        f"/api/certificates/{cert_id}/renewal-reminders",
        json={"channels": ["EMAIL", "SMS", "WHATSAPP"]},
    )
    assert reminder.status_code == 200
    rem_data = reminder.json()
    assert rem_data["channels"] == ["EMAIL", "SMS", "WHATSAPP"]
