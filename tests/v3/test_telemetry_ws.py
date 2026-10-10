import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_v3_telemetry_websocket_ping_pong():
    with client.websocket_connect("/api/v3/telemetry/ws/WB-TEST-2026") as websocket:
        # First or second frame should be broadcasted telemetry packet
        data = websocket.receive_json()
        assert "instrument_id" in data
        assert data["instrument_id"] == "WB-TEST-2026"
        assert "cells" in data
        assert len(data["cells"]) == 4
        assert "gross_weight" in data
        assert "zero_drift" in data
        assert "corner_imbalance" in data

        # Send PING command
        websocket.send_text("PING")
        pong = websocket.receive_text()
        assert pong == "PONG"
