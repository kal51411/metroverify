from fastapi import APIRouter, Query
from typing import List
from app.services.diagnostics_service import DiagnosticsService

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])

@router.post("/signal-stability")
def analyze_signal(samples: List[float], sampling_rate_hz: float = 10.0):
    return DiagnosticsService.analyze_signal_stability(samples, sampling_rate_hz)

@router.get("/creep")
def evaluate_creep(
    load_kg: float = Query(..., gt=0),
    start_reading_kg: float = Query(...),
    end_reading_kg: float = Query(...),
    duration_minutes: float = 30.0
):
    return DiagnosticsService.evaluate_load_cell_creep(
        load_kg, start_reading_kg, end_reading_kg, duration_minutes
    )
