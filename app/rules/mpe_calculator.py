from typing import Dict, Any, Tuple
from app.models.instruments import AccuracyClassEnum
from app.rules.base import METROLOGY_GENERAL_RULES_METADATA

# MPE interval steps in multiples of e: (upper_e_limit, mpe_multiplier_in_e)
MPE_TABLES_INITIAL = {
    AccuracyClassEnum.CLASS_I: [
        (50000, 0.5),
        (200000, 1.0),
        (float("inf"), 1.5)
    ],
    AccuracyClassEnum.CLASS_II: [
        (5000, 0.5),
        (20000, 1.0),
        (float("inf"), 1.5)
    ],
    AccuracyClassEnum.CLASS_III: [
        (500, 0.5),
        (2000, 1.0),
        (10000, 1.5),
        (float("inf"), 1.5)
    ],
    AccuracyClassEnum.CLASS_IIII: [
        (50, 0.5),
        (200, 1.0),
        (1000, 1.5),
        (float("inf"), 1.5)
    ]
}

def calculate_mpe(
    load: float,
    e: float,
    accuracy_class: AccuracyClassEnum,
    verification_mode: str = "INITIAL",
    rule_version: str = METROLOGY_GENERAL_RULES_METADATA.rule_version
) -> Dict[str, Any]:
    """
    Calculates Maximum Permissible Error (MPE) for Non-Automatic Weighing Instruments.
    m = test load
    e = verification scale interval
    verification_interval_count = m / e
    mpe_in_e = factor * e
    """
    if e <= 0:
        raise ValueError("Verification scale interval e must be strictly positive.")
    if load < 0:
        raise ValueError("Test load cannot be negative.")
        
    intervals_m_over_e = load / e
    table = MPE_TABLES_INITIAL.get(accuracy_class, MPE_TABLES_INITIAL[AccuracyClassEnum.CLASS_III])
    
    mpe_factor = 1.5
    band_limit = "m > upper"
    for limit, factor in table:
        if intervals_m_over_e <= limit:
            mpe_factor = factor
            band_limit = f"m <= {limit}e"
            break
            
    # For in-service / re-verification where rule specifies 2x initial MPE
    if verification_mode in ("IN_SERVICE", "SERVICE_INSPECTION"):
        mpe_factor *= 2.0
        
    mpe_value = round(mpe_factor * e, 8)
    
    return {
        "load": load,
        "e": e,
        "accuracy_class": accuracy_class.value if hasattr(accuracy_class, "value") else str(accuracy_class),
        "verification_mode": verification_mode,
        "verification_interval_count": round(intervals_m_over_e, 4),
        "mpe_factor_in_e": mpe_factor,
        "mpe_value": mpe_value,
        "mpe_band": band_limit,
        "rule_version": rule_version,
        "source": METROLOGY_GENERAL_RULES_METADATA.source_document
    }

def evaluate_indication_error(
    load_target: float,
    standard_value: float,
    observed_value: float,
    e: float,
    accuracy_class: AccuracyClassEnum,
    verification_mode: str = "INITIAL"
) -> Dict[str, Any]:
    """
    Evaluates observed indication against standard value and computes MPE compliance.
    error = observed_value - standard_value
    error_percentage = (error / standard_value) * 100 if standard_value != 0 else 0.0
    within_mpe = abs(error) <= mpe_value + 1e-9
    """
    mpe_info = calculate_mpe(load_target, e, accuracy_class, verification_mode)
    error = round(observed_value - standard_value, 8)
    abs_error = abs(error)
    error_percentage = round((error / standard_value) * 100, 4) if standard_value > 0 else 0.0
    
    # 1e-9 epsilon for floating point precision
    within_mpe = abs_error <= (mpe_info["mpe_value"] + 1e-9)
    difference_from_limit = round(abs_error - mpe_info["mpe_value"], 8)
    
    return {
        "load_target": load_target,
        "standard_value": standard_value,
        "observed_value": observed_value,
        "error": error,
        "error_absolute": abs_error,
        "error_percentage": error_percentage,
        "verification_interval_count": mpe_info["verification_interval_count"],
        "mpe": mpe_info["mpe_value"],
        "mpe_factor_in_e": mpe_info["mpe_factor_in_e"],
        "within_mpe": within_mpe,
        "difference_from_limit": difference_from_limit,
        "result": "PASS" if within_mpe else "FAIL",
        "rule_version": mpe_info["rule_version"],
        "source": mpe_info["source"]
    }
