import pytest
from app.services.v3_ocr_service import V3OCRService
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_v3_ocr_service_parsing():
    raw_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR..."
    result = V3OCRService.parse_scale_plate_image(raw_bytes, "plate_sample_9821.png")
    assert result["status"] == "EXTRACTED_SUCCESSFULLY"
    assert "serial_number" in result
    assert "max_capacity" in result
    assert "verification_scale_interval_e" in result
    assert result["ocr_confidence"] >= 0.90

def test_v3_ai_ocr_endpoint():
    files = {"file": ("scale_plate.jpg", b"fake_plate_image_data_stream", "image/jpeg")}
    res = client.post("/api/v3/ai/ocr-plate", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "serial_number" in data
    assert "accuracy_class" in data
    assert data["max_capacity"] > 0

def test_v3_ai_copilot_endpoint():
    res = client.post("/api/v3/ai/copilot", json={"query": "What is the repeatability allowance for weighbridges?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "statutory_reference" in data
    assert "rule_version" in data
