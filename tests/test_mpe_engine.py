import pytest
from app.models.instruments import AccuracyClassEnum
from app.rules.mpe_calculator import calculate_mpe, evaluate_indication_error

def test_class_iii_mpe_calculation():
    # Class III: e = 0.05 kg
    # 0 to 500e (0 to 25 kg): +/- 0.5e = +/- 0.025 kg
    # 500e to 2000e (25 to 100 kg): +/- 1.0e = +/- 0.050 kg
    # 2000e to 10000e (100 to 500 kg): +/- 1.5e = +/- 0.075 kg
    e = 0.05
    
    # At 10 kg (200e <= 500e)
    r1 = calculate_mpe(10.0, e, AccuracyClassEnum.CLASS_III)
    assert r1["mpe_factor_in_e"] == 0.5
    assert r1["mpe_value"] == 0.025
    
    # Boundary at 25 kg (500e)
    r2 = calculate_mpe(25.0, e, AccuracyClassEnum.CLASS_III)
    assert r2["mpe_factor_in_e"] == 0.5
    assert r2["mpe_value"] == 0.025
    
    # At 50 kg (1000e)
    r3 = calculate_mpe(50.0, e, AccuracyClassEnum.CLASS_III)
    assert r3["mpe_factor_in_e"] == 1.0
    assert r3["mpe_value"] == 0.050
    
    # Boundary at 100 kg (2000e)
    r4 = calculate_mpe(100.0, e, AccuracyClassEnum.CLASS_III)
    assert r4["mpe_factor_in_e"] == 1.0
    assert r4["mpe_value"] == 0.050
    
    # At 150 kg (3000e)
    r5 = calculate_mpe(150.0, e, AccuracyClassEnum.CLASS_III)
    assert r5["mpe_factor_in_e"] == 1.5
    assert r5["mpe_value"] == 0.075

def test_class_i_and_ii_mpe():
    # Class I: 0 to 50000e (+/-0.5e), 50000e to 200000e (+/-1.0e)
    e = 0.001
    r_c1 = calculate_mpe(40.0, e, AccuracyClassEnum.CLASS_I) # 40000e
    assert r_c1["mpe_factor_in_e"] == 0.5
    assert r_c1["mpe_value"] == 0.0005

    # Class II: 0 to 5000e (+/-0.5e), 5000e to 20000e (+/-1.0e)
    e_ii = 0.01
    r_c2 = calculate_mpe(100.0, e_ii, AccuracyClassEnum.CLASS_II) # 10000e
    assert r_c2["mpe_factor_in_e"] == 1.0
    assert r_c2["mpe_value"] == 0.01

def test_indication_error_pass_fail():
    e = 0.05
    # Standard: 50.0 kg, Observed: 50.041 kg (Error: +0.041 kg <= MPE 0.050 kg) -> PASS
    pass_eval = evaluate_indication_error(50.0, 50.0, 50.041, e, AccuracyClassEnum.CLASS_III)
    assert pass_eval["within_mpe"] is True
    assert pass_eval["result"] == "PASS"
    assert pass_eval["error"] == 0.041

    # Standard: 50.0 kg, Observed: 50.061 kg (Error: +0.061 kg > MPE 0.050 kg) -> FAIL
    fail_eval = evaluate_indication_error(50.0, 50.0, 50.061, e, AccuracyClassEnum.CLASS_III)
    assert fail_eval["within_mpe"] is False
    assert fail_eval["result"] == "FAIL"
    assert fail_eval["difference_from_limit"] == 0.011
