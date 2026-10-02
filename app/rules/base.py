from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RuleMetadata(BaseModel):
    source_name: str
    source_document: str
    section_or_schedule: str
    rule_version: str
    effective_from: str
    effective_until: Optional[str] = None
    notes: Optional[str] = None

DEFAULT_RULESET_VERSION = "Legal Metrology (General) Rules, 2011 (Amended 2025/2026)"

METROLOGY_GENERAL_RULES_METADATA = RuleMetadata(
    source_name="Government of India / Legal Metrology",
    source_document="Legal Metrology (General) Rules, 2011",
    section_or_schedule="Seventh Schedule (Heading-A: Non-automatic Weighing Instruments)",
    rule_version="2026.4",
    effective_from="2011-04-01",
    notes="Includes 2025 7th Amendment and 2026 4th Amendment on High-Capacity Weighing"
)

MAHARASHTRA_ENFORCEMENT_RULES_METADATA = RuleMetadata(
    source_name="Government of Maharashtra",
    source_document="Maharashtra Legal Metrology (Enforcement) Rules, 2011",
    section_or_schedule="Schedule IX (Certificate of Verification)",
    rule_version="2011.1",
    effective_from="2011-04-01",
    notes="Official state enforcement procedure and Schedule IX digital record specification"
)
