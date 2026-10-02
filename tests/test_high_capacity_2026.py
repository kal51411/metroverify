import pytest
from app.rules.high_capacity import evaluate_high_capacity_substitution

def test_high_capacity_2026_one_fifth_eligibility():
    # 60,000 kg weighbridge, e = 20 kg
    # 0.2e = 4 kg, 0.3e = 6 kg
    # Repeatability readings with max - min <= 4 kg (e.g. 30000, 30003, 30001 -> range = 3 kg)
    res = evaluate_high_capacity_substitution(
        max_capacity=60000.0,
        e=20.0,
        repeatability_readings=[30000.0, 30003.0, 30001.0],
        unit="kg"
    )
    assert res["repeatability_error"] == 3.0
    assert res["eligibility"] == "ELIGIBLE_ONE_FIFTH"
    assert res["required_standard_load"] == 12000.0 # 1/5 of 60,000 kg
    assert "1/5" in res["fraction_label"]

def test_high_capacity_2026_one_third_eligibility():
    # Repeatability range = 5.0 kg (4 kg < 5 kg <= 6 kg -> within 0.3e)
    res = evaluate_high_capacity_substitution(
        max_capacity=60000.0,
        e=20.0,
        repeatability_readings=[30000.0, 30005.0, 30001.0],
        unit="kg"
    )
    assert res["repeatability_error"] == 5.0
    assert res["eligibility"] == "ELIGIBLE_ONE_THIRD"
    assert res["required_standard_load"] == 20000.0 # 1/3 of 60,000 kg
    assert "1/3" in res["fraction_label"]

def test_high_capacity_2026_not_eligible_baseline():
    # Repeatability range = 8.0 kg (> 6 kg -> exceeds 0.3e)
    res = evaluate_high_capacity_substitution(
        max_capacity=60000.0,
        e=20.0,
        repeatability_readings=[30000.0, 30008.0, 30000.0],
        unit="kg"
    )
    assert res["repeatability_error"] == 8.0
    assert res["eligibility"] == "NOT_ELIGIBLE"
    assert res["required_standard_load"] == 30000.0 # Baseline 1/2 of 60,000 kg
