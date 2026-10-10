import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Radio, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  X, Check, ChevronRight, Navigation, Sparkles, Scale, RefreshCw 
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

interface GeoInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: number;
  instrumentId?: number;
  onSuccess?: (result: any) => void;
}

export function GeoInspectionModal({
  isOpen,
  onClose,
  applicationId = 1,
  instrumentId = 1,
  onSuccess
}: GeoInspectionModalProps) {
  // GPS State
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number }>({
    lat: 18.52043,
    lng: 73.85674,
    accuracy: 3.4
  });
  const [gpsLock, setGpsLock] = useState<boolean>(true);
  const [address, setAddress] = useState<string>("APMC Market Yard, Gultekdi, Pune, Maharashtra 411037");

  // Checklist items based on Legal Metrology General Rules 2011 Schedule VII
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "stamping_plate",
      label: "Model Stamping Plate Verification",
      description: "Model approval number (IND/xx/xxxx) and manufacturer mark intact & legible.",
      passed: true
    },
    {
      id: "spirit_level",
      label: "Level Indicator & Foundation Check",
      description: "Spirit level bubble centered; no mechanical distortion or platform wobble.",
      passed: true
    },
    {
      id: "eccentricity",
      label: "Eccentricity (Corner Load) Test",
      description: "Readings across 4 platform corners conform to 1/3 Max statutory MPE limits.",
      passed: true
    },
    {
      id: "lead_seal",
      label: "Security Wire & Lead Seal Inspection",
      description: "Calibration access port and junction box sealed against unauthorized adjustment.",
      passed: true
    }
  ]);

  // Load Test Measurement state
  const [targetLoad, setTargetLoad] = useState<number>(50.0);
  const [observedLoad, setObservedLoad] = useState<number>(50.02);
  const [eInterval, setEInterval] = useState<number>(0.05);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute calculated error and compliance
  const observedError = Number((observedLoad - targetLoad).toFixed(4));
  const absError = Math.abs(observedError);
  // For Class III: load <= 500e (25kg) -> 0.5e, 500e < load <= 2000e (100kg) -> 1.0e (0.05kg)
  const allowedMpe = eInterval * 1.0;
  const isMeasurementCompliant = absError <= allowedMpe;
  const isOverallPass = checklist.every(c => c.passed) && isMeasurementCompliant;

  const toggleChecklist = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  const handleSimulateGPSRefresh = () => {
    setGpsLock(false);
    setTimeout(() => {
      setCoords({
        lat: Number((18.5204 + (Math.random() - 0.5) * 0.002).toFixed(5)),
        lng: Number((73.8567 + (Math.random() - 0.5) * 0.002).toFixed(5)),
        accuracy: Number((2.5 + Math.random() * 2.0).toFixed(1))
      });
      setGpsLock(true);
    }, 600);
  };

  const handleSubmitInspection = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      application_id: applicationId,
      instrument_id: instrumentId,
      verification_mode: "INITIAL",
      geo: {
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy_meters: coords.accuracy
      },
      inspection_address: address,
      checklist: checklist.map(c => ({
        key: c.id,
        label: c.label,
        passed: c.passed
      })),
      measurements: [
        {
          step_key: "indication_error",
          load_target: targetLoad,
          standard_value: targetLoad,
          observed_value: observedLoad,
          error: observedError,
          mpe: allowedMpe,
          within_mpe: isMeasurementCompliant
        }
      ],
      ambient_temperature_c: 26.0,
      relative_humidity_pct: 54.0,
      notes: "On-site GPS field inspection executed via MetroVerify v3."
    };

    try {
      const token = localStorage.getItem("metro_token") || "";
      const res = await fetch("/api/v3/inspections/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Inspection execution failed.");
      }

      const data = await res.json();
      setSubmissionResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit inspection record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl rounded-3xl bg-[#111113]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg text-[#FAFAFA]">Geo-Tagged Field Verification</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                  v3 Radar
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">GPS Enforcement & Cryptographic Inspection Stamping</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {submissionResult ? (
            /* Success confirmation card */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display font-semibold text-2xl text-[#FAFAFA]">Inspection Certified & Hashed</h3>
                <p className="text-sm text-zinc-400 mt-1 font-mono">
                  Reference: <span className="text-cyan-400">{submissionResult.inspection_id}</span>
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left max-w-lg mx-auto font-mono text-xs space-y-3">
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-zinc-500">Decision Status:</span>
                  <span className="text-emerald-400 font-bold">{submissionResult.final_result}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.04] pb-2">
                  <span className="text-zinc-500">GPS Verified At:</span>
                  <span className="text-[#FAFAFA]">{submissionResult.geo_latitude.toFixed(5)}, {submissionResult.geo_longitude.toFixed(5)}</span>
                </div>
                <div className="border-b border-white/[0.04] pb-2">
                  <span className="text-zinc-500 block mb-1">SHA-256 Audit Integrity Hash:</span>
                  <span className="text-cyan-400 break-all text-[10px]">{submissionResult.audit_hash}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Statutory Determination:</span>
                  <span className="text-zinc-300">{submissionResult.decision_summary}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(14,165,233,0.3)]"
              >
                Close Verification Modal
              </button>
            </motion.div>
          ) : (
            <>
              {/* GPS Radar Strip */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-6 h-6 rounded-full bg-cyan-500/20 animate-ping" />
                    <Radio className="w-5 h-5 text-cyan-400 relative z-10" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-zinc-400">
                      Coordinates: <span className="text-[#FAFAFA] font-bold">{coords.lat}° N, {coords.lng}° E</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Satellite Accuracy: ±{coords.accuracy}m · Geo-Fence Lock: Active
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSimulateGPSRefresh}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-500/40 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${!gpsLock ? "animate-spin" : ""}`} />
                  <span>Acquire GPS</span>
                </button>
              </div>

              {/* Physical Location */}
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-2">Verified Inspection Premise Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-[#FAFAFA] font-sans outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Statutory Metrology Checklist */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display font-semibold text-sm text-[#FAFAFA] tracking-tight">
                    Statutory Metrology Compliance Checklist
                  </h4>
                  <span className="text-xs font-mono text-zinc-500">Schedule VII Rules</span>
                </div>

                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        item.passed
                          ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40"
                          : "bg-red-500/[0.03] border-red-500/20 hover:border-red-500/40"
                      }`}
                    >
                      <div>
                        <div className="font-display font-medium text-sm text-[#FAFAFA] flex items-center gap-2">
                          <span>{item.label}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                      </div>

                      <button
                        type="button"
                        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all ${
                          item.passed
                            ? "bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            : "bg-zinc-800 text-zinc-400 border border-white/[0.08]"
                        }`}
                      >
                        {item.passed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load Measurement Trial */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-sm text-[#FAFAFA]">Indication Error Test (Trial 1)</span>
                  <span className="text-xs font-mono text-cyan-400">Accuracy Class III (e = 0.05kg)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1.5">Standard Test Load (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={targetLoad}
                      onChange={(e) => setTargetLoad(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-[#FAFAFA] font-mono outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1.5">Observed Indication (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={observedLoad}
                      onChange={(e) => setObservedLoad(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-[#FAFAFA] font-mono outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
                  <span className="text-zinc-400">
                    Calculated Error: <strong className={observedError >= 0 ? "text-cyan-400" : "text-amber-400"}>
                      {observedError > 0 ? `+${observedError}` : observedError} kg
                    </strong> (MPE Threshold: ±{allowedMpe} kg)
                  </span>
                  <span className={isMeasurementCompliant ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                    {isMeasurementCompliant ? "WITHIN MPE (PASS)" : "EXCEEDS MPE (FAIL)"}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <div className="text-xs font-mono">
                  Status: <strong className={isOverallPass ? "text-emerald-400" : "text-red-400"}>
                    {isOverallPass ? "STATUTORY COMPLIANT" : "REJECTION CRITERIA MET"}
                  </strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitInspection}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Hashing & Logging...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Verification</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
