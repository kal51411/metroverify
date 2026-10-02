from typing import Dict, Any, Optional
from datetime import datetime

MAHARASHTRA_FEE_SCHEDULE_2018 = [
    # Non-automatic weighing instruments - Class III / Platform / Electronic scales
    {"type": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "min_cap": 0, "max_cap": 50, "base_fee": 100.0, "premises_extra": 100.0},
    {"type": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "min_cap": 50, "max_cap": 200, "base_fee": 200.0, "premises_extra": 150.0},
    {"type": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "min_cap": 200, "max_cap": 500, "base_fee": 400.0, "premises_extra": 250.0},
    {"type": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "min_cap": 500, "max_cap": 1000, "base_fee": 500.0, "premises_extra": 300.0},
    {"type": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "min_cap": 1000, "max_cap": 5000, "base_fee": 1000.0, "premises_extra": 500.0},
    {"type": "WEIGHBRIDGE", "min_cap": 5000, "max_cap": 100000, "base_fee": 3000.0, "premises_extra": 2000.0},
    {"type": "COUNTER_MACHINE", "min_cap": 0, "max_cap": 50, "base_fee": 100.0, "premises_extra": 50.0},
    {"type": "BEAM_SCALE", "min_cap": 0, "max_cap": 50, "base_fee": 50.0, "premises_extra": 50.0},
]

def calculate_verification_fee(
    instrument_type: str,
    capacity: float,
    is_premises_verification: bool = False
) -> Dict[str, Any]:
    """
    Calculates verification fees based on Maharashtra LM Fee Notification 20-04-2018.
    """
    itype = (instrument_type or "NON_AUTOMATIC_WEIGHING_INSTRUMENT").upper()
    
    matched = None
    for item in MAHARASHTRA_FEE_SCHEDULE_2018:
        if item["type"] == itype and item["min_cap"] <= capacity <= item["max_cap"]:
            matched = item
            break
            
    if not matched:
        # Fallback closest match
        for item in MAHARASHTRA_FEE_SCHEDULE_2018:
            if item["type"] == itype:
                matched = item
                break
                
    if not matched:
        matched = {"type": itype, "base_fee": 200.0, "premises_extra": 100.0}
        
    base_fee = matched["base_fee"]
    premises_fee = matched["premises_extra"] if is_premises_verification else 0.0
    total_fee = base_fee + premises_fee
    
    return {
        "instrument_type": itype,
        "capacity": capacity,
        "base_fee": base_fee,
        "premises_verification_fee": premises_fee,
        "total_fee": total_fee,
        "fee_schedule": "Maharashtra Legal Metrology Fee Notification 20-04-2018",
        "rule_version": "2018.1 (Effective 20-04-2018)",
        "effective_date": "2018-04-20"
    }
