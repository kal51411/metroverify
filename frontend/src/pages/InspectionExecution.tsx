import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle, RefreshCw, Download, FileText } from "lucide-react";

interface InspectionExecutionProps {
  applicationId: number;
  onBack: () => void;
}

const STEPS = [
  { key: "visual",      num: "01", title: "Identity",       desc: "Metrological identity inspection" },
  { key: "zero",        num: "02", title: "Zero",           desc: "Zero setting accuracy" },
  { key: "indication",  num: "03", title: "Load Tests",     desc: "Indication accuracy at 4 load points" },
  { key: "repeatability", num: "04", title: "Repeatability", desc: "3 consecutive readings at ½ Max" },
  { key: "eccentricity",  num: "05", title: "Eccentricity", desc: "5-position off-centre loading" },
  { key: "discrimination",num: "06", title: "Discrimination","desc": "Threshold detection +1.4d" },
  { key: "tare",         num: "07", title: "Tare",          desc: "Tare subtraction verification" },
  { key: "zero_return",  num: "08", title: "Zero Return",   desc: "Post-load zero restoration" },
  { key: "seals",        num: "09", title: "Sealing",       desc: "Verification seal record" },
] as const;

type StepKey = typeof STEPS[number]["key"];

const ECCENTRICITY_POSITIONS = ["CENTER", "TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"];

/* ── Small components ─────────────────────────────────────────── */

const FieldInput: React.FC<{
  label: string; value: string | number; unit?: string;
  onChange: (v: string) => void; placeholder?: string; large?: boolean;
}> = ({ label, value, unit, onChange, placeholder = "—", large }) => (
  <div className="space-y-1.5">
    <label className="font-mono text-[10px] text-ash uppercase tracking-widest block">{label}</label>
    <div className="flex items-center border border-iron bg-black focus-within:border-amber transition-colors">
      <input
        type="number" step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 bg-transparent px-4 py-2.5 font-mono font-bold text-warm focus:outline-none ${large ? "text-2xl" : "text-base"}`}
      />
      {unit && <span className="font-mono text-xs text-steel px-3">{unit}</span>}
    </div>
  </div>
);

const PassFailToggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between border border-iron px-4 py-3 hover:border-steel transition-colors">
    <span className="text-sm text-fog">{label}</span>
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={`px-3 py-1 font-mono text-[11px] font-bold border transition-colors ${
            value === v
              ? v ? "bg-pass/15 border-pass/50 text-pass" : "bg-fail/15 border-fail/50 text-fail"
              : "border-iron text-steel hover:border-steel"
          }`}
        >
          {v ? "PASS" : "FAIL"}
        </button>
      ))}
    </div>
  </div>
);

/* ── Main component ───────────────────────────────────────────── */

export const InspectionExecution: React.FC<InspectionExecutionProps> = ({ applicationId, onBack }) => {
  const [app, setApp] = useState<any>(null);
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cert, setCert] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedStdIds, setSelectedStdIds] = useState<string[]>([]);

  // ── Form state (all empty by default) ─────────────────────────
  const [visual, setVisual] = useState({
    nameplate_intact: true, markings_legible: true, serial_matches_application: true,
    level_indicator_centered: true, sealing_provision_intact: true,
    physical_condition_acceptable: true, notes: "",
  });
  const [zeroTest, setZeroTest] = useState({ zero_before: "", zero_after: "", stable_zero_indicator: true, zero_tracking_active: true });
  const [indications, setIndications] = useState<any[]>([]);
  const [repeatability, setRepeatability] = useState({ test_load: "", r1: "", r2: "", r3: "" });
  const [eccentricity, setEccentricity] = useState<any[]>([]);
  const [discrimination, setDiscrimination] = useState({ test_load: "", base_indication: "", extra_load_applied: "", new_indication: "", indication_incremented: true });
  const [tare, setTare] = useState({ gross_load: "", tare_load: "", observed_net: "", tare_visibility_verified: true });
  const [zeroReturn, setZeroReturn] = useState({ zero_after_unloading: "", zero_return_stable: true });
  const [seals, setSeals] = useState({ seal_number: "", seal_type: "WIRE_SECURITY_SEAL", seal_location: "JUNCTION_BOX_AND_CALIBRATION_PORT", verification_mark_location: "FRONT_NAMEPLATE", condition: "INTACT" });

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [appData, stds] = await Promise.all([api.getApplication(applicationId), api.getStandards()]);
        setApp(appData);
        setStandards(stds);
        setSelectedStdIds(stds.filter((s: any) => s.status === "ACTIVE").slice(0, 1).map((s: any) => s.standard_asset_id));
        const inst = appData.instrument;
        if (inst) {
          const { verification_scale_interval_e: e, max_capacity: max, min_capacity: min } = inst;
          setIndications([
            { load_target: min || 1.0, standard_value: min || 1.0, observed_value: "" },
            { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: "" },
            { load_target: Math.round(0.5 * max), standard_value: Math.round(0.5 * max), observed_value: "" },
            { load_target: max, standard_value: max, observed_value: "" },
          ]);
          const eccLoad = Math.round(0.3 * max);
          setEccentricity(ECCENTRICITY_POSITIONS.map(p => ({ position: p, standard_value: eccLoad, observed_value: "" })));
          setRepeatability(prev => ({ ...prev, test_load: String(Math.round(0.5 * max)) }));
          setDiscrimination(prev => ({ ...prev, test_load: String(Math.round(0.5 * max)), extra_load_applied: String(parseFloat((1.4 * e).toFixed(6))) }));
          setTare(prev => ({ ...prev, gross_load: String(Math.round(0.2 * max)) }));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [applicationId]);

  // ── Demo mode fill/clear ────────────────────────────────────────
  const toggleDemo = () => {
    const inst = app?.instrument;
    if (!inst) return;
    const { verification_scale_interval_e: e, max_capacity: max, min_capacity: min } = inst;
    if (!isDemoMode) {
      const half = Math.round(0.5 * max);
      setIndications([
        { load_target: min || 1.0, standard_value: min || 1.0, observed_value: (min || 1.0) + 0.005 },
        { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: Math.round(500 * e) + 0.015 },
        { load_target: half, standard_value: half, observed_value: half + 0.041 },
        { load_target: max, standard_value: max, observed_value: max + 0.050 },
      ]);
      setRepeatability({ test_load: String(half), r1: String(half + 0.040), r2: String(half + 0.042), r3: String(half + 0.041) });
      const eccLoad = Math.round(0.3 * max);
      setEccentricity(ECCENTRICITY_POSITIONS.map((p, i) => ({ position: p, standard_value: eccLoad, observed_value: eccLoad + [0.040, 0.045, 0.038, 0.042, 0.044][i] })));
      setDiscrimination({ test_load: String(half), base_indication: String(half), extra_load_applied: String(parseFloat((1.4 * e).toFixed(6))), new_indication: String(half + e), indication_incremented: true });
      setTare({ gross_load: String(Math.round(0.2 * max)), tare_load: String(Math.round(0.05 * max)), observed_net: String(Math.round(0.15 * max) + 0.005), tare_visibility_verified: true });
      setZeroTest({ zero_before: "0.000", zero_after: "0.000", stable_zero_indicator: true, zero_tracking_active: true });
      setZeroReturn({ zero_after_unloading: "0.000", zero_return_stable: true });
      setSeals(prev => ({ ...prev, seal_number: `MH-DEMO-${Date.now().toString().slice(-6)}` }));
      setIsDemoMode(true);
    } else {
      const eccLoad = Math.round(0.3 * max);
      setIndications(prev => prev.map(p => ({ ...p, observed_value: "" })));
      setRepeatability(prev => ({ ...prev, r1: "", r2: "", r3: "" }));
      setEccentricity(ECCENTRICITY_POSITIONS.map(p => ({ position: p, standard_value: eccLoad, observed_value: "" })));
      setDiscrimination(prev => ({ ...prev, base_indication: "", new_indication: "" }));
      setTare(prev => ({ ...prev, tare_load: "", observed_net: "" }));
      setZeroTest({ zero_before: "", zero_after: "", stable_zero_indicator: true, zero_tracking_active: true });
      setZeroReturn({ zero_after_unloading: "", zero_return_stable: true });
      setSeals(prev => ({ ...prev, seal_number: "" }));
      setIsDemoMode(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleRun = async () => {
    try {
      setExecuting(true);
      const payload = {
        visual_inspection: visual,
        zero_test: { zero_before: parseFloat(zeroTest.zero_before) || 0, zero_after: parseFloat(zeroTest.zero_after) || 0, stable_zero_indicator: zeroTest.stable_zero_indicator, zero_tracking_active: zeroTest.zero_tracking_active },
        indication_tests: indications.map(t => ({ load_target: parseFloat(t.load_target), standard_value: parseFloat(t.standard_value), observed_value: parseFloat(t.observed_value) })),
        repeatability_test: { test_load: parseFloat(repeatability.test_load), readings: [parseFloat(repeatability.r1), parseFloat(repeatability.r2), parseFloat(repeatability.r3)] },
        eccentricity_test: eccentricity.map(p => ({ position: p.position, standard_value: parseFloat(p.standard_value), observed_value: parseFloat(p.observed_value) })),
        discrimination_test: { test_load: parseFloat(discrimination.test_load), base_indication: parseFloat(discrimination.base_indication), extra_load_applied: parseFloat(discrimination.extra_load_applied), new_indication: parseFloat(discrimination.new_indication), indication_incremented: discrimination.indication_incremented },
        tare_test: { gross_load: parseFloat(tare.gross_load), tare_load: parseFloat(tare.tare_load), observed_net: parseFloat(tare.observed_net), tare_visibility_verified: tare.tare_visibility_verified },
        zero_return_test: { zero_after_unloading: parseFloat(zeroReturn.zero_after_unloading) || 0, zero_return_stable: zeroReturn.zero_return_stable },
        seal_record: seals,
        standard_asset_ids: selectedStdIds,
        test_location: app?.test_centre_or_premises || "Trader Premises",
        is_demo_mode: isDemoMode,
      };
      const res = await api.completeInspection(applicationId, payload);
      setResult(res);
    } catch (err: any) {
      alert("Verification engine error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleCertificate = async () => {
    try { setCert(await api.generateCertificate(applicationId)); }
    catch (err: any) { alert("Certificate error: " + err.message); }
  };

  // ── Render step content ─────────────────────────────────────────
  const renderStep = () => {
    const inst = app?.instrument;
    const u = inst?.unit || "kg";

    switch (STEPS[step].key) {
      case "visual":
        return (
          <div className="space-y-4">
            <p className="text-silver text-sm leading-relaxed">Confirm metrological identity and physical integrity before testing.</p>
            <div className="space-y-2">
              {([
                ["nameplate_intact", "Nameplate & Approval Mark Intact"],
                ["markings_legible", "Verification Marks Legible"],
                ["serial_matches_application", "Serial Number Matches Application"],
                ["level_indicator_centered", "Level Indicator Centred"],
                ["sealing_provision_intact", "Sealing Provision Intact"],
                ["physical_condition_acceptable", "Physical Condition Acceptable"],
              ] as [keyof typeof visual, string][]).map(([key, label]) => (
                <PassFailToggle key={key} label={label} value={visual[key] as boolean} onChange={(v) => setVisual(p => ({ ...p, [key]: v }))} />
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] text-ash uppercase tracking-widest block">Notes (optional)</label>
              <textarea
                value={visual.notes}
                onChange={(e) => setVisual(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="Additional observations..."
                className="w-full bg-black border border-iron px-4 py-3 font-mono text-sm text-warm placeholder:text-steel focus:outline-none focus:border-amber transition-colors resize-none"
              />
            </div>
          </div>
        );

      case "zero":
        return (
          <div className="space-y-5">
            <p className="text-silver text-sm leading-relaxed">Zero indication before and after test loading. Must be within ±0.25e.</p>
            <div className="grid grid-cols-2 gap-4">
              <FieldInput label="Zero Before Load" value={zeroTest.zero_before} unit={u} onChange={v => setZeroTest(p => ({ ...p, zero_before: v }))} placeholder="0.000" large />
              <FieldInput label="Zero After Load" value={zeroTest.zero_after} unit={u} onChange={v => setZeroTest(p => ({ ...p, zero_after: v }))} placeholder="0.000" large />
            </div>
            <div className="space-y-2">
              <PassFailToggle label="Zero Indicator Stable" value={zeroTest.stable_zero_indicator} onChange={v => setZeroTest(p => ({ ...p, stable_zero_indicator: v }))} />
              <PassFailToggle label="Zero Tracking Active" value={zeroTest.zero_tracking_active} onChange={v => setZeroTest(p => ({ ...p, zero_tracking_active: v }))} />
            </div>
          </div>
        );

      case "indication":
        return (
          <div className="space-y-4">
            <p className="text-silver text-sm leading-relaxed">Apply standard weights at four load points. Record instrument indication.</p>
            {indications.map((t, i) => {
              const err = parseFloat(t.observed_value) - parseFloat(t.standard_value);
              const hasVal = t.observed_value !== "" && !isNaN(parseFloat(t.observed_value));
              const isOk = hasVal && Math.abs(err) <= inst?.verification_scale_interval_e;
              return (
                <div key={i} className="border border-iron p-4 space-y-3 bg-charcoal">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-ash uppercase tracking-widest">Load Point {i + 1}</span>
                    <span className="font-mono font-bold text-warm">{t.standard_value} {u}</span>
                  </div>
                  <FieldInput
                    label="Observed Indication"
                    value={t.observed_value}
                    unit={u}
                    onChange={v => { const u2 = [...indications]; u2[i] = { ...u2[i], observed_value: v }; setIndications(u2); }}
                    placeholder="Enter reading..."
                    large
                  />
                  {hasVal && (
                    <div className={`font-mono text-xs flex items-center gap-3 ${isOk ? "text-pass" : "text-fail"}`}>
                      <span>Error: {err >= 0 ? "+" : ""}{err.toFixed(4)} {u}</span>
                      <span className="font-bold">{isOk ? "✓ Within MPE" : "✕ Exceeds MPE"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case "repeatability":
        return (
          <div className="space-y-5">
            <p className="text-silver text-sm leading-relaxed">Apply the same load 3 times. Range must not exceed 1 MPE at that load.</p>
            <FieldInput label="Test Load" value={repeatability.test_load} unit={u} onChange={v => setRepeatability(p => ({ ...p, test_load: v }))} />
            <div className="grid grid-cols-3 gap-4">
              {(["r1", "r2", "r3"] as const).map((k, i) => (
                <FieldInput key={k} label={`Run 0${i + 1}`} value={repeatability[k]} unit={u} onChange={v => setRepeatability(p => ({ ...p, [k]: v }))} placeholder="0.000" large />
              ))}
            </div>
            {[repeatability.r1, repeatability.r2, repeatability.r3].every(r => r !== "" && !isNaN(parseFloat(r))) && (() => {
              const vals = [parseFloat(repeatability.r1), parseFloat(repeatability.r2), parseFloat(repeatability.r3)];
              const range = Math.max(...vals) - Math.min(...vals);
              const mpe = inst?.verification_scale_interval_e || 0.1;
              return (
                <div className={`border p-4 space-y-2 ${range <= mpe ? "border-pass/30 bg-passBg" : "border-fail/30 bg-failBg"}`}>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-ash">Range</span>
                    <span className={`font-bold ${range <= mpe ? "text-pass" : "text-fail"}`}>{range.toFixed(4)} {u}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm">
                    <span className="text-ash">MPE Limit</span>
                    <span className="text-amber-light font-bold">±{mpe.toFixed(4)} {u}</span>
                  </div>
                  <div className={`font-mono font-bold text-lg ${range <= mpe ? "text-pass" : "text-fail"}`}>
                    {range <= mpe ? "✓ PASS" : "✕ FAIL"}
                  </div>
                </div>
              );
            })()}
          </div>
        );

      case "eccentricity":
        return (
          <div className="space-y-4">
            <p className="text-silver text-sm leading-relaxed">Apply ⅓ Max load to each of 5 positions on the platform surface.</p>
            {eccentricity.map((pos, i) => (
              <div key={pos.position} className="border border-iron p-4 flex items-center gap-4 bg-charcoal">
                <div className="w-28 shrink-0">
                  <div className="font-mono text-[10px] text-ash uppercase tracking-widest mb-0.5">Position</div>
                  <div className="font-mono text-xs font-bold text-fog">{pos.position.replace(/_/g, " ")}</div>
                  <div className="font-mono text-[10px] text-steel mt-0.5">STD: {pos.standard_value} {u}</div>
                </div>
                <div className="flex-1">
                  <FieldInput label="Observed" value={pos.observed_value} unit={u} onChange={v => { const e2 = [...eccentricity]; e2[i] = { ...e2[i], observed_value: v }; setEccentricity(e2); }} placeholder="0.000" />
                </div>
              </div>
            ))}
          </div>
        );

      case "discrimination":
        return (
          <div className="space-y-5">
            <p className="text-silver text-sm leading-relaxed">Add 1.4d to a stabilised load. Indication must change by at least 1d.</p>
            <div className="grid grid-cols-2 gap-4">
              {([
                ["test_load", "Test Load"],
                ["base_indication", "Base Indication"],
                ["extra_load_applied", "Extra Load (+1.4d)"],
                ["new_indication", "New Indication"],
              ] as const).map(([k, label]) => (
                <FieldInput key={k} label={label} value={discrimination[k]} unit={u} onChange={v => setDiscrimination(p => ({ ...p, [k]: v }))} placeholder="0.000" />
              ))}
            </div>
            <PassFailToggle label="Indication incremented by at least 1d" value={discrimination.indication_incremented} onChange={v => setDiscrimination(p => ({ ...p, indication_incremented: v }))} />
          </div>
        );

      case "tare":
        return (
          <div className="space-y-5">
            <p className="text-silver text-sm leading-relaxed">Verify net indication matches gross minus tare. Error must be within MPE.</p>
            <div className="grid grid-cols-3 gap-4">
              <FieldInput label="Gross Load" value={tare.gross_load} unit={u} onChange={v => setTare(p => ({ ...p, gross_load: v }))} large />
              <FieldInput label="Tare Load" value={tare.tare_load} unit={u} onChange={v => setTare(p => ({ ...p, tare_load: v }))} large />
              <FieldInput label="Observed Net" value={tare.observed_net} unit={u} onChange={v => setTare(p => ({ ...p, observed_net: v }))} large />
            </div>
            <PassFailToggle label="Tare indication clearly visible" value={tare.tare_visibility_verified} onChange={v => setTare(p => ({ ...p, tare_visibility_verified: v }))} />
          </div>
        );

      case "zero_return":
        return (
          <div className="space-y-5">
            <p className="text-silver text-sm leading-relaxed">After removing all loads, instrument must return to zero within ±0.25e.</p>
            <FieldInput label="Zero Reading After Unloading" value={zeroReturn.zero_after_unloading} unit={u} onChange={v => setZeroReturn(p => ({ ...p, zero_after_unloading: v }))} placeholder="0.000" large />
            <PassFailToggle label="Zero stable after unloading" value={zeroReturn.zero_return_stable} onChange={v => setZeroReturn(p => ({ ...p, zero_return_stable: v }))} />
          </div>
        );

      case "seals":
        return (
          <div className="space-y-4">
            <p className="text-silver text-sm leading-relaxed">Record the verification seal applied after satisfactory testing.</p>
            {([
              ["seal_number", "Seal Number"],
              ["seal_type", "Seal Type"],
              ["seal_location", "Seal Location"],
              ["verification_mark_location", "Verification Mark Location"],
            ] as const).map(([k, label]) => (
              <div key={k} className="space-y-1.5">
                <label className="font-mono text-[10px] text-ash uppercase tracking-widest block">{label}</label>
                <input
                  type="text"
                  value={seals[k]}
                  onChange={(e) => setSeals(p => ({ ...p, [k]: e.target.value }))}
                  placeholder={label}
                  className="w-full bg-black border border-iron px-4 py-3 font-mono text-sm text-warm placeholder:text-steel focus:outline-none focus:border-amber transition-colors"
                />
              </div>
            ))}
          </div>
        );

      default: return null;
    }
  };

  if (loading || !app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-6 h-6 animate-spin text-amber" />
        <span className="font-mono text-sm text-ash">Loading inspection parameters…</span>
      </div>
    );
  }

  const inst = app.instrument;

  return (
    <div className="space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-iron">
        <div className="space-y-1.5">
          <button onClick={onBack} className="font-mono text-xs text-ash hover:text-amber transition-colors flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> INSPECTOR WORKSTATION
          </button>
          <h2 className="font-display font-bold text-4xl text-warm tracking-tight">Statutory Inspection</h2>
          <div className="flex flex-wrap gap-3 font-mono text-xs text-ash">
            <span>{inst?.manufacturer} {inst?.model}</span>
            <span className="text-steel">·</span>
            <span>{inst?.serial_number}</span>
            <span className="text-steel">·</span>
            <span className="text-fog">{inst?.accuracy_class?.replace("_", " ")}</span>
            <span className="text-steel">·</span>
            <span className="text-amber">{app.application_id}</span>
          </div>
        </div>

        <button
          onClick={toggleDemo}
          className={`flex items-center gap-2 px-4 py-2.5 border font-mono text-xs font-bold tracking-wider transition-colors ${
            isDemoMode
              ? "bg-amber/10 border-amber/50 text-amber"
              : "border-iron text-ash hover:border-steel hover:text-fog"
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${isDemoMode ? "text-amber" : "text-steel"}`} />
          {isDemoMode ? "DEMO MODE ACTIVE" : "MANUAL ENTRY"}
        </button>
      </div>

      {isDemoMode && (
        <div className="border border-amber/30 bg-amber/5 px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-amber/80 leading-relaxed">
            DEMO MODE — Pre-filled synthetic values. These are not real field measurements.
            Switch to Manual Entry before recording actual inspection data.
          </p>
        </div>
      )}

      {/* ── INSTRUMENT SPEC RAIL ── */}
      <div className="grid grid-cols-5 border border-iron divide-x divide-iron bg-charcoal">
        {[
          { label: "MAX CAPACITY", value: `${inst?.max_capacity} ${inst?.unit}` },
          { label: "MIN CAPACITY", value: `${inst?.min_capacity} ${inst?.unit}` },
          { label: "INTERVAL e", value: `${inst?.verification_scale_interval_e} ${inst?.unit}` },
          { label: "INTERVAL d", value: `${inst?.actual_scale_interval_d} ${inst?.unit}` },
          { label: "CLASS", value: inst?.accuracy_class?.replace("_", " ") },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-1">{label}</div>
            <div className="font-mono font-bold text-warm text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-12 gap-0 border border-iron min-h-[65vh]">
        {/* LEFT: Step rail */}
        <div className="col-span-3 border-r border-iron bg-charcoal flex flex-col">
          <div className="border-b border-iron px-4 py-3">
            <div className="font-mono text-[9px] text-ash uppercase tracking-widest">Test Sequence</div>
          </div>
          <nav className="flex-1 py-1">
            {STEPS.map((s, i) => {
              const isActive = step === i;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    isActive
                      ? "border-amber bg-amber/5 text-warm"
                      : "border-transparent text-ash hover:text-fog hover:bg-black/30"
                  }`}
                >
                  <span className={`font-mono text-[10px] mt-0.5 ${isActive ? "text-amber" : "text-steel"}`}>{s.num}</span>
                  <div>
                    <div className="font-mono text-xs font-bold tracking-wide">{s.title}</div>
                    <div className="font-mono text-[10px] text-steel mt-0.5 leading-tight">{s.desc}</div>
                  </div>
                  {result && (
                    <span className="ml-auto mt-0.5">
                      {result.is_pass
                        ? <CheckCircle className="w-3.5 h-3.5 text-pass" />
                        : <span className="w-3.5 h-3.5 text-steel">—</span>
                      }
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Standards */}
          <div className="border-t border-iron p-4 space-y-2">
            <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-2">Standards Used</div>
            {standards.filter((s: any) => s.status === "ACTIVE").map((s: any) => (
              <label key={s.standard_asset_id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStdIds.includes(s.standard_asset_id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStdIds(p => [...p, s.standard_asset_id]);
                    else setSelectedStdIds(p => p.filter(id => id !== s.standard_asset_id));
                  }}
                  className="mt-0.5 w-3 h-3 accent-amber"
                />
                <div>
                  <div className="font-mono text-[10px] text-fog">{s.standard_asset_id}</div>
                  <div className="font-mono text-[9px] text-steel">{s.nominal_mass}{s.unit} {s.accuracy_class}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* CENTER: Current step */}
        <div className="col-span-6 border-r border-iron">
          <div className="border-b border-iron px-6 py-3 flex items-center justify-between">
            <span className="font-mono text-[9px] text-ash uppercase tracking-widest">Measurement Input</span>
            <span className="font-mono text-xs text-amber font-bold">{STEPS[step].num} — {STEPS[step].title}</span>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-display font-bold text-2xl text-warm mb-1">{STEPS[step].title}</h3>
              <div className="w-8 h-px bg-amber mb-4" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step nav */}
          <div className="border-t border-iron px-6 py-4 flex items-center justify-between">
            <button
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
              className="font-mono text-xs text-ash hover:text-fog disabled:opacity-30 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="font-mono text-xs font-bold text-amber hover:text-amber-light flex items-center gap-1 transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={executing}
                className="px-6 py-2.5 bg-amber hover:bg-amber-light disabled:opacity-60 text-black font-mono text-xs font-bold tracking-wider flex items-center gap-2 transition-colors"
              >
                {executing
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running…</>
                  : <>Run Verification Engine</>
                }
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Context + Result */}
        <div className="col-span-3 bg-charcoal flex flex-col">
          <div className="border-b border-iron px-4 py-3">
            <div className="font-mono text-[9px] text-ash uppercase tracking-widest">Instrument Context</div>
          </div>

          <div className="p-4 border-b border-iron space-y-4">
            <div>
              <div className="font-mono text-[9px] text-steel uppercase tracking-widest mb-1">Class</div>
              <div className="font-display font-bold text-2xl text-warm">{inst?.accuracy_class?.replace("_", " ")}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Max", val: inst?.max_capacity, unit: inst?.unit },
                { label: "Min", val: inst?.min_capacity, unit: inst?.unit },
                { label: "e", val: inst?.verification_scale_interval_e, unit: inst?.unit },
              ].map(({ label, val, unit }) => (
                <div key={label} className="border border-iron py-2 text-center">
                  <div className="font-mono text-[9px] text-steel">{label}</div>
                  <div className="font-mono text-sm font-bold text-fog">{val}</div>
                  <div className="font-mono text-[9px] text-steel">{unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-iron space-y-1">
            <div className="font-mono text-[9px] text-steel uppercase tracking-widest mb-1">Owner</div>
            <div className="font-mono text-xs text-fog">{inst?.owner_name}</div>
            <div className="font-mono text-[10px] text-steel">{inst?.business_name}</div>
            <div className="font-mono text-[10px] text-steel">{inst?.district}, {inst?.division}</div>
          </div>

          {/* Result panel */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex-1 p-4 space-y-4 ${result.is_pass ? "bg-passBg" : "bg-failBg"}`}
              >
                <div className="font-mono text-[9px] text-ash uppercase tracking-widest">Inspection Result</div>
                <div className={`flex items-center gap-2 font-display font-extrabold text-3xl ${result.is_pass ? "text-pass" : "text-fail"}`}>
                  {result.is_pass ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                  {result.final_result}
                </div>

                {result.max_observed_error !== undefined && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-ash">Max Error</span>
                      <span className="font-bold text-warm">{Number(result.max_observed_error).toFixed(4)} {inst?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ash">MPE Limit</span>
                      <span className="text-amber-light font-bold">±{Number(result.max_error_mpe_limit).toFixed(4)} {inst?.unit}</span>
                    </div>
                  </div>
                )}

                {result.failed_reasons?.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-mono text-[9px] text-fail uppercase tracking-widest">Failed Tests</div>
                    {result.failed_reasons.map((r: string, i: number) => (
                      <div key={i} className="font-mono text-[10px] text-fail/80 leading-relaxed">• {r}</div>
                    ))}
                  </div>
                )}

                {result.is_pass && !cert && (
                  <button
                    onClick={handleCertificate}
                    className="w-full py-3 bg-pass hover:bg-pass/80 text-black font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> Generate Certificate
                  </button>
                )}

                {cert && (
                  <div className="border border-pass/30 bg-pass/5 p-3 space-y-2">
                    <div className="font-mono text-[9px] text-pass uppercase tracking-widest">Certificate Issued</div>
                    <div className="font-mono text-sm font-bold text-warm">{cert.certificate_number}</div>
                    <div className="font-mono text-[10px] text-ash break-all">{cert.certificate_hash?.slice(0, 28)}…</div>
                    <a
                      href={`/api/certificates/${cert.certificate_id}/pdf`}
                      target="_blank"
                      className="flex items-center gap-1.5 font-mono text-xs text-pass hover:underline"
                    >
                      <Download className="w-3 h-3" /> Download PDF
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
