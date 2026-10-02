from typing import Dict, Any
from datetime import datetime
from dateutil.relativedelta import relativedelta
from app.rules.base import RuleMetadata

INTERVAL_RULES_TABLE = [
    # 24 Months categories as per Legal Metrology (General) Rules Rule 27 & Dec 2025 7th Amendment
    {"category": "WEIGHTS", "type": "ALL", "months": 24, "source": "Rule 27(1)(a) Legal Metrology (General) Rules, 2011"},
    {"category": "CAPACITY_MEASURES", "type": "ALL", "months": 24, "source": "Rule 27(1)(a) Legal Metrology (General) Rules, 2011"},
    {"category": "LENGTH_MEASURES", "type": "ALL", "months": 24, "source": "Rule 27(1)(a) Legal Metrology (General) Rules, 2011"},
    {"category": "BEAM_SCALE", "type": "ALL", "months": 24, "source": "Rule 27(1)(a) Legal Metrology (General) Rules, 2011"},
    {"category": "COUNTER_MACHINE", "type": "ALL", "months": 24, "source": "Rule 27(1)(a) Legal Metrology (General) Rules, 2011"},
    {"category": "FUEL_DISPENSER", "type": "ALL", "months": 24, "source": "Legal Metrology (General) Seventh Amendment Rules, 2025 (Rule 27(2)(a))"},
    # 12 Months categories for electronic commercial weighing instruments, platform scales, weighbridges
    {"category": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "type": "ELECTRONIC_SCALE", "months": 12, "source": "Rule 27(1)(b) Legal Metrology (General) Rules, 2011"},
    {"category": "NON_AUTOMATIC_WEIGHING_INSTRUMENT", "type": "PLATFORM_SCALE", "months": 12, "source": "Rule 27(1)(b) Legal Metrology (General) Rules, 2011"},
    {"category": "WEIGHBRIDGE", "type": "ALL", "months": 12, "source": "Rule 27(1)(b) Legal Metrology (General) Rules, 2011"},
    {"category": "AUTOMATIC_WEIGHING_INSTRUMENT", "type": "ALL", "months": 12, "source": "Rule 27(1)(b) Legal Metrology (General) Rules, 2011"},
]

def determine_verification_interval(
    instrument_category: str,
    instrument_type: str,
    verification_date: datetime
) -> Dict[str, Any]:
    """
    Determines legal verification validity period from versioned rule database.
    Does NOT hardcode 365 days.
    """
    cat = (instrument_category or "NON_AUTOMATIC_WEIGHING_INSTRUMENT").upper()
    itype = (instrument_type or "ELECTRONIC_SCALE").upper()
    
    matched_rule = None
    for rule in INTERVAL_RULES_TABLE:
        if rule["category"] == cat and (rule["type"] == "ALL" or rule["type"] == itype):
            matched_rule = rule
            break
            
    if not matched_rule:
        for rule in INTERVAL_RULES_TABLE:
            if rule["category"] == cat:
                matched_rule = rule
                break
                
    if not matched_rule:
        matched_rule = {"category": cat, "type": itype, "months": 12, "source": "Legal Metrology (General) Rules, 2011 (General Provision)"}
        
    months = matched_rule["months"]
    next_due_date = verification_date + relativedelta(months=months)
    
    return {
        "interval_months": months,
        "verification_date": verification_date,
        "next_due_date": next_due_date,
        "rule_source": matched_rule["source"],
        "rule_version": "2026.1"
    }
