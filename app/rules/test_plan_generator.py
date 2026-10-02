from typing import List, Dict, Any
from app.models.instruments import AccuracyClassEnum
from app.rules.mpe_calculator import calculate_mpe

def generate_load_test_plan(
    min_capacity: float,
    max_capacity: float,
    e: float,
    accuracy_class: AccuracyClassEnum,
    unit: str = "kg"
) -> List[Dict[str, Any]]:
    """
    Generates test load points including Min, Max, and MPE transition points.
    For Class III: 500e, 2000e, etc.
    """
    steps = []
    
    # 1. Zero load
    steps.append({
        "step_name": "Zero Load Test",
        "load_target": 0.0,
        "description": "Verification of zero indication and stable zero tracking",
        "mpe": calculate_mpe(0.0, e, accuracy_class)["mpe_value"],
        "unit": unit
    })
    
    # 2. Min Capacity
    if min_capacity > 0:
        steps.append({
            "step_name": f"Minimum Capacity ({min_capacity} {unit})",
            "load_target": min_capacity,
            "description": "Verification at Min capacity",
            "mpe": calculate_mpe(min_capacity, e, accuracy_class)["mpe_value"],
            "unit": unit
        })
        
    # 3. Transition points for the class
    transition_points = []
    if accuracy_class == AccuracyClassEnum.CLASS_III:
        t1 = round(500 * e, 4)
        t2 = round(2000 * e, 4)
        if min_capacity < t1 < max_capacity:
            transition_points.append(t1)
        if min_capacity < t2 < max_capacity:
            transition_points.append(t2)
    elif accuracy_class == AccuracyClassEnum.CLASS_II:
        t1 = round(5000 * e, 4)
        t2 = round(20000 * e, 4)
        if min_capacity < t1 < max_capacity:
            transition_points.append(t1)
        if min_capacity < t2 < max_capacity:
            transition_points.append(t2)
    elif accuracy_class == AccuracyClassEnum.CLASS_I:
        t1 = round(50000 * e, 4)
        t2 = round(200000 * e, 4)
        if min_capacity < t1 < max_capacity:
            transition_points.append(t1)
        if min_capacity < t2 < max_capacity:
            transition_points.append(t2)
            
    # Mid range
    mid_load = round(0.5 * max_capacity, 4)
    if min_capacity < mid_load < max_capacity and mid_load not in transition_points:
        transition_points.append(mid_load)
        
    transition_points.sort()
    for tp in transition_points:
        steps.append({
            "step_name": f"Load Point ({tp} {unit})",
            "load_target": tp,
            "description": f"Verification at transition/mid point ({tp} {unit})",
            "mpe": calculate_mpe(tp, e, accuracy_class)["mpe_value"],
            "unit": unit
        })
        
    # Max Capacity
    steps.append({
        "step_name": f"Maximum Capacity ({max_capacity} {unit})",
        "load_target": max_capacity,
        "description": "Verification at Max capacity",
        "mpe": calculate_mpe(max_capacity, e, accuracy_class)["mpe_value"],
        "unit": unit
    })
    
    return steps
