import json
from typing import Dict, Any, List

NAWI_CLASS_III_ROUTINE_STEPS = [
    {
        "step_order": 1,
        "step_key": "visual_inspection",
        "step_name": "Visual & Metrological Identification",
        "is_mandatory": True,
        "description": "Check manufacturer, model, serial no, model approval number, markings, sealing provisions, level indicator and physical condition."
    },
    {
        "step_order": 2,
        "step_key": "zero_test",
        "step_name": "Zero Setting & Stability Test",
        "is_mandatory": True,
        "description": "Verify zero indication before and after loading, stable zero condition within +/- 0.25e."
    },
    {
        "step_order": 3,
        "step_key": "indication_error",
        "step_name": "Weighing Performance & Indication Error (MPE)",
        "is_mandatory": True,
        "description": "Test at Zero, Min, MPE transition points (500e, 2000e), mid-load, and Max capacity. Observe indication error against legal MPE."
    },
    {
        "step_order": 4,
        "step_key": "repeatability",
        "step_name": "Repeatability Test (3 runs for Class III)",
        "is_mandatory": True,
        "description": "Apply test load of approx 0.5 Max or Max three consecutive times. Max reading minus min reading must not exceed MPE at that load."
    },
    {
        "step_order": 5,
        "step_key": "eccentricity",
        "step_name": "Eccentric Loading Test",
        "is_mandatory": True,
        "description": "Apply 1/3 Max (or 1/(n-1) Max for multi-point) at corners/positions: Center, Top-Left, Top-Right, Bottom-Left, Bottom-Right."
    },
    {
        "step_order": 6,
        "step_key": "discrimination",
        "step_name": "Discrimination Test",
        "is_mandatory": True,
        "description": "At Min, 0.5 Max, and Max, gently apply additional load of 1.4d. Indication must unambiguously increment by 1 scale interval."
    },
    {
        "step_order": 7,
        "step_key": "tare",
        "step_name": "Tare Operation & Net Indication Test",
        "is_mandatory": False,
        "description": "Verify tare subtraction, net calculation accuracy, and tare scale interval if applicable."
    },
    {
        "step_order": 8,
        "step_key": "zero_return",
        "step_name": "Zero Return Test",
        "is_mandatory": True,
        "description": "Remove load after testing and confirm scale returns to zero within permissible limits (+/- 0.5e)."
    },
    {
        "step_order": 9,
        "step_key": "sealing_and_marks",
        "step_name": "Verification Mark & Sealing Record",
        "is_mandatory": True,
        "description": "Record physical seal numbers, seal wire condition, and verification stamp location."
    }
]

HIGH_CAPACITY_WEIGHBRIDGE_STEPS = NAWI_CLASS_III_ROUTINE_STEPS + [
    {
        "step_order": 10,
        "step_key": "high_capacity_substitution",
        "step_name": "High-Capacity Standard Weight Substitution Test (2026 Rule)",
        "is_mandatory": True,
        "description": "Determine eligibility for standard weight reduction (1/3 Max or 1/5 Max) by placing substitution load 3 times and calculating repeatability error."
    }
]

def get_default_template_steps(instrument_type: str) -> List[Dict[str, Any]]:
    if "WEIGHBRIDGE" in (instrument_type or "").upper():
        return HIGH_CAPACITY_WEIGHBRIDGE_STEPS
    return NAWI_CLASS_III_ROUTINE_STEPS
