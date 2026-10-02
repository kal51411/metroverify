from typing import List, Dict, Any
from app.rules.base import RuleMetadata

HIGH_CAPACITY_2026_RULE_METADATA = RuleMetadata(
    source_name="Government of India, Ministry of Consumer Affairs",
    source_document="Legal Metrology (General) Fourth Amendment Rules, 2026",
    section_or_schedule="Verification of High Capacity Weighing Instruments at Place of Use",
    rule_version="2026.4 (July 2026)",
    effective_from="2026-07-01",
    notes="Dynamic reduction of standard weights based on repeatability test with substitution load"
)

def evaluate_high_capacity_substitution(
    max_capacity: float,
    e: float,
    repeatability_readings: List[float],
    unit: str = "kg"
) -> Dict[str, Any]:
    """
    Implements 2026 Fourth Amendment for High Capacity Weighing Instruments:
    - Baseline: Standard weights >= 1/2 Max (50%)
    - Place substitution load 3 times on the receptor.
    - repeatability_error = max(readings) - min(readings)
    - If repeatability_error <= 0.3 * e: eligible for 1/3 Max (33.33%)
    - If repeatability_error <= 0.2 * e: eligible for 1/5 Max (20.00%)
    - Otherwise: must use baseline 1/2 Max.
    """
    if len(repeatability_readings) < 3:
        raise ValueError("High capacity repeatability test requires at least 3 consecutive weighings.")
    if max_capacity <= 0 or e <= 0:
        raise ValueError("Capacity and scale interval e must be strictly positive.")
        
    readings = [round(r, 6) for r in repeatability_readings[:3]]
    max_val = max(readings)
    min_val = min(readings)
    repeatability_error = round(max_val - min_val, 6)
    
    threshold_02e = round(0.2 * e, 6)
    threshold_03e = round(0.3 * e, 6)
    
    baseline_standard_load = round(0.5 * max_capacity, 2)
    
    if repeatability_error <= threshold_02e + 1e-9:
        eligibility = "ELIGIBLE_ONE_FIFTH"
        fraction = 1.0 / 5.0
        fraction_label = "1/5 Max (20%)"
        required_standard_load = round(fraction * max_capacity, 2)
        decision_reason = (
            f"Repeatability error ({repeatability_error} {unit}) is within 0.2e ({threshold_02e} {unit}). "
            f"Standard weight requirement reduced to 1/5 of Max ({required_standard_load} {unit})."
        )
    elif repeatability_error <= threshold_03e + 1e-9:
        eligibility = "ELIGIBLE_ONE_THIRD"
        fraction = 1.0 / 3.0
        fraction_label = "1/3 Max (33.33%)"
        required_standard_load = round(fraction * max_capacity, 2)
        decision_reason = (
            f"Repeatability error ({repeatability_error} {unit}) is within 0.3e ({threshold_03e} {unit}). "
            f"Standard weight requirement reduced to 1/3 of Max ({required_standard_load} {unit})."
        )
    else:
        eligibility = "NOT_ELIGIBLE"
        fraction = 0.5
        fraction_label = "1/2 Max (50%) [Baseline]"
        required_standard_load = baseline_standard_load
        decision_reason = (
            f"Repeatability error ({repeatability_error} {unit}) exceeds 0.3e threshold ({threshold_03e} {unit}). "
            f"Instrument must be verified using baseline standard weights of not less than 1/2 Max ({required_standard_load} {unit})."
        )
        
    return {
        "max_capacity": max_capacity,
        "e": e,
        "unit": unit,
        "readings": readings,
        "max_reading": max_val,
        "min_reading": min_val,
        "repeatability_error": repeatability_error,
        "threshold_02e": threshold_02e,
        "threshold_03e": threshold_03e,
        "baseline_standard_load": baseline_standard_load,
        "eligibility": eligibility,
        "fraction_label": fraction_label,
        "required_standard_load": required_standard_load,
        "decision_reason": decision_reason,
        "rule_version": HIGH_CAPACITY_2026_RULE_METADATA.rule_version,
        "source": HIGH_CAPACITY_2026_RULE_METADATA.source_document
    }
