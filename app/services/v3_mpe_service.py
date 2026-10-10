from typing import Dict, Any
from app.models.instruments import AccuracyClassEnum
from app.rules.base import METROLOGY_GENERAL_RULES_METADATA

MPE_TABLES_V3 = {
    AccuracyClassEnum.CLASS_I: [(50000, 0.5), (200000, 1.0), (float("inf"), 1.5)],
    AccuracyClassEnum.CLASS_II: [(5000, 0.5), (20000, 1.0), (float("inf"), 1.5)],
    AccuracyClassEnum.CLASS_III: [(500, 0.5), (2000, 1.0), (10000, 1.5), (float("inf"), 1.5)],
    AccuracyClassEnum.CLASS_IIII: [(50, 0.5), (200, 1.0), (1000, 1.5), (float("inf"), 1.5)]
}

def calculate_v3_mpe(
    load: float,
    e: float,
    accuracy_class: AccuracyClassEnum,
    verification_mode: str = "INITIAL"
) -> Dict[str, Any]:
    if e <= 0:
        raise ValueError("Verification scale interval e must be positive.")
    if load < 0:
        raise ValueError("Test load cannot be negative.")

    intervals = load / e
    table = MPE_TABLES_V3.get(accuracy_class, MPE_TABLES_V3[AccuracyClassEnum.CLASS_III])

    factor = 1.5
    band_desc = "m > upper limit"
    for limit, f in table:
        if intervals <= limit:
            factor = f
            band_desc = f"m <= {limit}e"
            break

    if verification_mode.upper() in ("IN_SERVICE", "SERVICE_INSPECTION"):
        factor *= 2.0

    mpe_value = round(factor * e, 6)
    return {
        "load": load,
        "e": e,
        "accuracy_class": accuracy_class.value if hasattr(accuracy_class, "value") else str(accuracy_class),
        "verification_mode": verification_mode,
        "m_over_e": round(intervals, 4),
        "mpe_factor": factor,
        "mpe_value": mpe_value,
        "mpe_band": band_desc,
        "rule_version": METROLOGY_GENERAL_RULES_METADATA.rule_version
    }
