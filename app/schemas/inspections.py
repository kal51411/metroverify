from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class VisualInspectionInput(BaseModel):
    nameplate_intact: bool = True
    markings_legible: bool = True
    serial_matches_application: bool = True
    level_indicator_centered: bool = True
    sealing_provision_intact: bool = True
    physical_condition_acceptable: bool = True
    notes: Optional[str] = None

class ZeroTestInput(BaseModel):
    zero_before: float = 0.0
    zero_after: float = 0.0
    stable_zero_indicator: bool = True
    zero_tracking_active: bool = True
    notes: Optional[str] = None

class IndicationTestMeasurementInput(BaseModel):
    load_target: float
    standard_value: float
    observed_value: float
    notes: Optional[str] = None

class RepeatabilityTestInput(BaseModel):
    test_load: float
    readings: List[float] = Field(..., min_length=3)
    notes: Optional[str] = None

class EccentricityMeasurementInput(BaseModel):
    position: str # CENTER, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
    standard_value: float
    observed_value: float
    notes: Optional[str] = None

class DiscriminationTestInput(BaseModel):
    test_load: float
    base_indication: float
    extra_load_applied: float # e.g., 1.4d
    new_indication: float
    indication_incremented: bool
    notes: Optional[str] = None

class TareTestInput(BaseModel):
    gross_load: float
    tare_load: float
    observed_net: float
    tare_visibility_verified: bool = True
    notes: Optional[str] = None

class ZeroReturnTestInput(BaseModel):
    zero_after_unloading: float
    zero_return_stable: bool = True
    notes: Optional[str] = None

class HighCapacitySubstitutionInput(BaseModel):
    substitution_test_load: float
    repeatability_readings: List[float] = Field(..., min_length=3)
    actual_standard_weights_available: float
    notes: Optional[str] = None

class SealRecordInput(BaseModel):
    seal_number: str
    seal_type: str = "WIRE_SECURITY_SEAL"
    seal_location: str = "JUNCTION_BOX_AND_CALIBRATION_PORT"
    verification_mark_location: str = "FRONT_NAMEPLATE"
    condition: str = "INTACT"

class CompleteInspectionInput(BaseModel):
    visual_inspection: VisualInspectionInput
    zero_test: ZeroTestInput
    indication_tests: List[IndicationTestMeasurementInput]
    repeatability_test: RepeatabilityTestInput
    eccentricity_test: List[EccentricityMeasurementInput]
    discrimination_test: DiscriminationTestInput
    tare_test: Optional[TareTestInput] = None
    zero_return_test: ZeroReturnTestInput
    high_capacity_substitution: Optional[HighCapacitySubstitutionInput] = None
    seal_record: SealRecordInput
    
    ambient_temperature_c: Optional[float] = 25.0
    relative_humidity_pct: Optional[float] = 55.0
    barometric_pressure_hpa: Optional[float] = 1013.25
    standard_asset_ids: List[str] = []
    test_location: Optional[str] = None
    is_demo_mode: bool = False

class TestMeasurementOut(BaseModel):
    id: int
    step_key: str
    load_target: float
    standard_value: float
    observed_value: float
    error: float
    error_percentage: float
    verification_interval_count: float
    mpe: float
    within_mpe: bool
    run_index: int
    position: Optional[str] = None
    is_accepted: bool
    correction_reason: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class InspectionTestStepOut(BaseModel):
    id: int
    step_key: str
    step_name: str
    step_order: int
    status: str
    raw_input_json: Optional[str] = None
    computed_result_json: Optional[str] = None
    failure_reason: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class InspectionOut(BaseModel):
    id: int
    inspection_id: str
    application_id: int
    instrument_id: int
    inspector_id: int
    ruleset_version: str
    status: str
    
    visual_inspection_status: str
    zero_test_status: str
    indication_test_status: str
    repeatability_test_status: str
    eccentricity_test_status: str
    discrimination_test_status: str
    tare_test_status: str
    zero_return_status: str
    high_capacity_substitution_status: str
    
    final_result: Optional[str] = None
    decision_summary: Optional[str] = None
    
    ambient_temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    barometric_pressure_hpa: Optional[float] = None
    test_location: Optional[str] = None
    
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    steps: List[InspectionTestStepOut] = []
    measurements: List[TestMeasurementOut] = []

    class Config:
        from_attributes = True
