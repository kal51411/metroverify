import math
from typing import List, Dict, Any

class DiagnosticsService:
    """
    ENGINEERING DIAGNOSTICS MODULE:
    Provides engineering analysis for load cells, sensor noise, zero drift, creep, hysteresis,
    and vibration spectrum index.
    
    IMPORTANT: As per system specification, these diagnostics inform sensor health and maintenance,
    and MUST NEVER be used as legal pass/fail criteria.
    """
    
    @staticmethod
    def analyze_signal_stability(samples: List[float], sampling_rate_hz: float = 10.0) -> Dict[str, Any]:
        if not samples or len(samples) < 5:
            return {"status": "INSUFFICIENT_DATA", "sample_count": len(samples)}
            
        n = len(samples)
        mean_val = sum(samples) / n
        variance = sum((x - mean_val) ** 2 for x in samples) / (n - 1)
        std_dev = math.sqrt(variance)
        peak_to_peak_noise = max(samples) - min(samples)
        
        # Signal to noise ratio (SNR) in dB
        snr_db = 20 * math.log10(abs(mean_val) / (std_dev + 1e-9)) if std_dev > 0 and abs(mean_val) > 0 else 0.0
        
        # Vibration index (relative high-frequency fluctuation)
        diffs = [abs(samples[i] - samples[i-1]) for i in range(1, n)]
        mean_diff = sum(diffs) / len(diffs)
        vibration_index = round(mean_diff / (std_dev + 1e-9), 3)
        
        # Health classification
        if std_dev < 0.005 and vibration_index < 1.5:
            health = "EXCELLENT_SIGNAL_INTEGRITY"
        elif std_dev < 0.02:
            health = "NORMAL_OPERATING_CONDITION"
        else:
            health = "HIGH_ENVIRONMENTAL_NOISE_OR_VIBRATION"
            
        return {
            "module": "ENGINEERING_DIAGNOSTIC (NON-LEGAL)",
            "sample_count": n,
            "sampling_rate_hz": sampling_rate_hz,
            "mean_signal": round(mean_val, 6),
            "variance": round(variance, 8),
            "standard_deviation": round(std_dev, 6),
            "peak_to_peak_noise": round(peak_to_peak_noise, 6),
            "snr_db": round(snr_db, 2),
            "vibration_index": vibration_index,
            "sensor_health_rating": health,
            "disclaimer": "Diagnostic information only. Informs sensor condition; does not constitute statutory pass/fail."
        }

    @staticmethod
    def evaluate_load_cell_creep(
        load_kg: float,
        start_reading_kg: float,
        end_reading_kg: float,
        duration_minutes: float = 30.0
    ) -> Dict[str, Any]:
        drift = round(end_reading_kg - start_reading_kg, 6)
        drift_rate_per_min = round(drift / duration_minutes, 8) if duration_minutes > 0 else 0.0
        drift_pct = round((drift / load_kg) * 100, 4) if load_kg > 0 else 0.0
        
        return {
            "module": "ENGINEERING_DIAGNOSTIC (NON-LEGAL)",
            "test_load_kg": load_kg,
            "duration_minutes": duration_minutes,
            "start_indication_kg": start_reading_kg,
            "end_indication_kg": end_reading_kg,
            "creep_drift_kg": drift,
            "creep_percentage": drift_pct,
            "drift_rate_kg_per_min": drift_rate_per_min,
            "interpretation": "Positive creep indicates viscoelastic strain; negative creep indicates mechanical settling.",
            "disclaimer": "Diagnostic information only. Informs sensor condition; does not constitute statutory pass/fail."
        }
