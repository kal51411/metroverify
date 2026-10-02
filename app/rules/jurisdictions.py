from typing import Dict, Any, List

MAHARASHTRA_JURISDICTIONS_DATA = [
    {"code": "MH-MUM-01", "division": "Mumbai", "district": "Mumbai City", "office_name": "Assistant Controller Legal Metrology, Mumbai South"},
    {"code": "MH-MUM-02", "division": "Mumbai", "district": "Mumbai Suburban", "office_name": "Assistant Controller Legal Metrology, Mumbai North"},
    {"code": "MH-PUN-01", "division": "Pune", "district": "Pune", "office_name": "Assistant Controller Legal Metrology, Pune Central"},
    {"code": "MH-PUN-02", "division": "Pune", "district": "Solapur", "office_name": "Inspector Legal Metrology, Solapur"},
    {"code": "MH-THN-01", "division": "Konkan", "district": "Thane", "office_name": "Assistant Controller Legal Metrology, Thane"},
    {"code": "MH-NAS-01", "division": "Nashik", "district": "Nashik", "office_name": "Assistant Controller Legal Metrology, Nashik"},
    {"code": "MH-AUR-01", "division": "Aurangabad", "district": "Chhatrapati Sambhajinagar", "office_name": "Assistant Controller Legal Metrology, Sambhajinagar"},
    {"code": "MH-NAG-01", "division": "Nagpur", "district": "Nagpur", "office_name": "Assistant Controller Legal Metrology, Nagpur East"},
]

def validate_application_jurisdiction(district: str, division: str) -> Dict[str, Any]:
    """
    Scrutinizes whether district and division match official Maharashtra Legal Metrology jurisdiction.
    """
    dist_clean = district.strip().lower() if district else ""
    div_clean = division.strip().lower() if division else ""
    
    for item in MAHARASHTRA_JURISDICTIONS_DATA:
        if dist_clean == item["district"].lower() and div_clean == item["division"].lower():
            return {
                "jurisdiction_status": "VALID_JURISDICTION",
                "jurisdiction_code": item["code"],
                "office_name": item["office_name"],
                "district": item["district"],
                "division": item["division"],
                "is_valid": True,
                "notes": "Verified against Maharashtra Legal Metrology territorial jurisdiction table."
            }
            
    # Check if district matches a different division (referred / wrong jurisdiction)
    for item in MAHARASHTRA_JURISDICTIONS_DATA:
        if dist_clean == item["district"].lower():
            return {
                "jurisdiction_status": "WRONG_JURISDICTION",
                "jurisdiction_code": item["code"],
                "office_name": item["office_name"],
                "district": item["district"],
                "division": item["division"],
                "is_valid": False,
                "notes": f"District {district} belongs to {item["division"]} division, not {division}."
            }
            
    return {
        "jurisdiction_status": "REFERRED",
        "jurisdiction_code": None,
        "office_name": "State Directorate Legal Metrology Maharashtra",
        "district": district,
        "division": division,
        "is_valid": False,
        "notes": f"Jurisdiction for district {district} in {division} division is unmapped and referred for manual scrutiny."
    }
