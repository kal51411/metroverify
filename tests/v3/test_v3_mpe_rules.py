import pytest
from app.models.instruments import AccuracyClassEnum
from app.services.v3_mpe_service import calculate_v3_mpe

def test_v3_mpe_class_iii_step_tiers():
    e = 0.05 # 50 grams
    # Tier 1: m <= 500e (load <= 25 kg) -> factor 0.5 -> MPE = 0.025
    r1 = calculate_v3_mpe(load=20.0, e=e, accuracy_class=AccuracyClassEnum.CLASS_III, verification_mode="INITIAL")
    assert r1["mpe_factor"] == 0.5
    assert r1["mpe_value"] == 0.025

    # Tier 2: 500e < m <= 2000e (load 50 kg) -> factor 1.0 -> MPE = 0.05
    r2 = calculate_v3_mpe(load=50.0, e=e, accuracy_class=AccuracyClassEnum.CLASS_III, verification_mode="INITIAL")
    assert r2["mpe_factor"] == 1.0
    assert r2["mpe_value"] == 0.05

    # Tier 3: m > 2000e (load 150 kg) -> factor 1.5 -> MPE = 0.075
    r3 = calculate_v3_mpe(load=150.0, e=e, accuracy_class=AccuracyClassEnum.CLASS_III, verification_mode="INITIAL")
    assert r3["mpe_factor"] == 1.5
    assert r3["mpe_value"] == 0.075

def test_v3_mpe_in_service_doubling():
    e = 0.05
    initial = calculate_v3_mpe(load=50.0, e=e, accuracy_class=AccuracyClassEnum.CLASS_III, verification_mode="INITIAL")
    inservice = calculate_v3_mpe(load=50.0, e=e, accuracy_class=AccuracyClassEnum.CLASS_III, verification_mode="IN_SERVICE")
    assert inservice["mpe_value"] == initial["mpe_value"] * 2.0
    assert inservice["mpe_factor"] == initial["mpe_factor"] * 2.0

def test_v3_mpe_all_accuracy_classes():
    for acc_class in [AccuracyClassEnum.CLASS_I, AccuracyClassEnum.CLASS_II, AccuracyClassEnum.CLASS_III, AccuracyClassEnum.CLASS_IIII]:
        res = calculate_v3_mpe(load=10.0, e=0.01, accuracy_class=acc_class, verification_mode="INITIAL")
        assert res["mpe_value"] > 0
        assert "mpe_band" in res
