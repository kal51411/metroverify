from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime

from app.database import get_db
from app.models.instruments import AccuracyClassEnum
from app.rules.mpe_calculator import calculate_mpe, evaluate_indication_error
from app.rules.high_capacity import evaluate_high_capacity_substitution
from app.rules.fees import calculate_verification_fee, MAHARASHTRA_FEE_SCHEDULE_2018
from app.rules.verification_intervals import determine_verification_interval, INTERVAL_RULES_TABLE
from app.rules.jurisdictions import MAHARASHTRA_JURISDICTIONS_DATA, validate_application_jurisdiction

router = APIRouter(prefix="/api/rulesets", tags=["rulesets"])

@router.get("/mpe/calculate")
def get_mpe_calculation(
    load: float = Query(..., ge=0),
    e: float = Query(..., gt=0),
    accuracy_class: AccuracyClassEnum = AccuracyClassEnum.CLASS_III,
    verification_mode: str = "INITIAL"
):
    return calculate_mpe(load=load, e=e, accuracy_class=accuracy_class, verification_mode=verification_mode)

@router.get("/mpe/evaluate-error")
def get_error_evaluation(
    load_target: float = Query(..., ge=0),
    standard_value: float = Query(..., ge=0),
    observed_value: float = Query(..., ge=0),
    e: float = Query(..., gt=0),
    accuracy_class: AccuracyClassEnum = AccuracyClassEnum.CLASS_III
):
    return evaluate_indication_error(
        load_target=load_target,
        standard_value=standard_value,
        observed_value=observed_value,
        e=e,
        accuracy_class=accuracy_class
    )

@router.get("/high-capacity/substitution")
def get_high_capacity_substitution_rule(
    max_capacity: float = Query(..., gt=0),
    e: float = Query(..., gt=0),
    r1: float = Query(...),
    r2: float = Query(...),
    r3: float = Query(...),
    unit: str = "kg"
):
    return evaluate_high_capacity_substitution(
        max_capacity=max_capacity,
        e=e,
        repeatability_readings=[r1, r2, r3],
        unit=unit
    )

@router.get("/fees/calculate")
def get_fee_calculation(
    instrument_type: str,
    capacity: float,
    is_premises: bool = False
):
    return calculate_verification_fee(instrument_type, capacity, is_premises)

@router.get("/intervals/lookup")
def get_interval_lookup(
    instrument_category: str,
    instrument_type: str = "ALL"
):
    return determine_verification_interval(instrument_category, instrument_type, datetime.utcnow())

@router.get("/jurisdictions/validate")
def get_jurisdiction_validation(district: str, division: str):
    return validate_application_jurisdiction(district, division)

@router.get("/jurisdictions/list")
def list_jurisdictions():
    return MAHARASHTRA_JURISDICTIONS_DATA
