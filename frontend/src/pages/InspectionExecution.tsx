import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  Scale, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, FileText, Download, ChevronLeft, ArrowRight, Minus
} from "lucide-react";

interface InspectionExecutionProps {
  applicationId: number;
  onBack: () => void;
}

const STEPS = [
  { key: "visual", label: "IDENTITY", num: "01" },
  { key: "zero", label: "ZERO", num: "02" },
  { key: "indication", label: "LOAD TESTS", num: "03" },
  { key: "repeatability", label: "REPEATABILITY", num: "04" },
  { key: "eccentricity", label: "ECCENTRICITY", num: "05" },
  { key: "discrimination", label: "DISCRIMINATION", num: "06" },
  { key: "tare", label: "TARE", num: "07" },
  { key: "zero_return", label: "ZERO RETURN", num: "08" },
  { key: "seals", label: "SEALING", num: "09" },
];

const EMPTY_ECCENTRICITY = [
  { position: "CENTER", standard_value: 0, observed_value: "" },
  { position: "TOP_LEFT", standard_value: 0, observed_value: "" },
  { position: "TOP_RIGHT", standard_value: 0, observed_value: "" },
  { position: "BOTTOM_LEFT", standard_value: 0, observed_value: "" },
  { position: "BOTTOM_RIGHT", standard_value: 0, observed_value: "" },
];

const DEMO_OFFSETS = [0.005, 0.015, 0.041, 0.050];

function clsStatus(result: string | undefined | null) {
  if (!result) return "text-slate-500";
  if (result === "PASS") return "text-metro-pass";
  if (result === "FAIL") return "text-metro-fail";
  return "text-metro-amber";
}

export const InspectionExecution: React.FC<InspectionExecutionProps> = ({ applicationId, onBack }) => {
  const [app, setApp] = useState<any | null>(null);
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [certData, setCertData] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // All measurement state — starts EMPTY (manual entry)
  const [visual, setVisual] = useState({
    nameplate_intact: true, markings_legible: true, serial_matches_application: true,
    level_indicator_centered: true, sealing_provision_intact: true,
    physical_condition_acceptable: true, notes: ""
  });

  const [zeroTest, setZeroTest] = useState({
    zero_before: "", zero_after: "", stable_zero_indicator: true, zero_tracking_active: true
  });

  const [indicationTests, setIndicationTests] = useState<any[]>([]);

  const [repeatability, setRepeatability] = useState({
    test_load: "", r1: "", r2: "", r3: ""
  });

  const [eccentricity, setEccentricity] = useState<any[]>(
    EMPTY_ECCENTRICITY.map(p => ({ ...p }))
  );

  const [discrimination, setDiscrimination] = useState({
    test_load: "", base_indication: "", extra_load_applied: "",
    new_indication: "", indication_incremented: true
  });

  const [tare, setTare] = useState({
    gross_load: "", tare_load: "", observed_net: "", tare_visibility_verified: true
  });

  const [zeroReturn, setZeroReturn] = useState({
    zero_after_unloading: "", zero_return_stable: true
  });

  const [seals, setSeals] = useState({
    seal_number: "", seal_type: "WIRE_SECURITY_SEAL",
    seal_location: "JUNCTION_BOX_AND_CALIBRATION_PORT",
    verification_mark_location: "FRONT_NAMEPLATE", condition: "INTACT"
  });

  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, stds] = await Promise.all([
        api.getApplication(applicationId),
        api.getStandards()
      ]);
      setApp(appData);
      setStandards(stds);
      setSelectedStandardIds(stds.filter((s: any) => s.status === "ACTIVE").slice(0, 1).map((s: any) => s.standard_asset_id));

      const inst = appData.instrument;
      if (inst) {
        const e = inst.verification_scale_interval_e;
        const max = inst.max_capacity;
        const min = inst.min_capacity;
        const testPoints = [
          { load_target: min || 1.0, standard_value: min || 1.0, observed_value: "" },
          { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: "" },
          { load_target: Math.round(0.5 * max), standard_value: Math.round(0.5 * max), observed_value: "" },
          { load_target: max, standard_value: max, observed_value: "" },
        ];
        setIndicationTests(testPoints);
        const eccLoad = Math.round(0.3 * max);
        setEccentricity(EMPTY_ECCENTRICITY.map(p => ({ ...p, standard_value: eccLoad })));
        setRepeatability(prev => ({ ...prev, test_load: String(Math.round(0.5 * max)) }));
        setDiscrimination(prev => ({ ...prev, test_load: String(Math.round(0.5 * max)), extra_load_applied: String(parseFloat((1.4 * e).toFixed(6))) }));
        setTare(prev => ({ ...prev, gross_load: String(Math.round(0.2 * max)) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fill demo values when demo mode is toggled on
  const fillDemoValues = (inst: any) => {
    const e = inst.verification_scale_interval_e;
    const max = inst.max_capacity;
    const min = inst.min_capacity;
    const testPoints = [
      { load_target: min || 1.0, standard_value: min || 1.0, observed_value: (min || 1.0) + DEMO_OFFSETS[0] },
      { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: Math.round(500 * e) + DEMO_OFFSETS[1] },
      { load_target: Math.round(0.5 * max), standard_value: Math.round(0.5 * max), observed_value: Math.round(0.5 * max) + DEMO_OFFSETS[2] },
      { load_target: max, standard_value: max, observed_value: max + DEMO_OFFSETS[3] },
    ];
    setIndicationTests(testPoints);
    const half = Math.round(0.5 * max);
    setRepeatability({ test_load: String(half), r1: String(half + 0.040), r2: String(half + 0.042), r3: String(half + 0.041) });
    const eccLoad = Math.round(0.3 * max);
    setEccentricity([
      { position: "CENTER", standard_value: eccLoad, observed_value: eccLoad + 0.040 },
      { position: "TOP_LEFT", standard_value: eccLoad, observed_value: eccLoad + 0.045 },
      { position: "TOP_RIGHT", standard_value: eccLoad, observed_value: eccLoad + 0.038 },
      { position: "BOTTOM_LEFT", standard_value: eccLoad, observed_value: eccLoad + 0.042 },
      { position: "BOTTOM_RIGHT", standard_value: eccLoad, observed_value: eccLoad + 0.044 },
    ]);
    setDiscrimination({ test_load: String(half), base_indication: String(half), extra_load_applied: String(parseFloat((1.4 * e).toFixed(6))), new_indication: String(half + e), indication_incremented: true });
    const gross = Math.round(0.2 * max);
    setTare({ gross_load: String(gross), tare_load: String(Math.round(0.05 * max)), observed_net: String(Math.round(0.15 * max) + 0.005), tare_visibility_verified: true });
    setZeroTest({ zero_before: "0.000", zero_after: "0.000", stable_zero_indicator: true, zero_tracking_active: true });
    setZeroReturn({ zero_after_unloading: "0.000", zero_return_stable: true });
    setSeals(prev => ({ ...prev, seal_number: `MH-LM-SEAL-DEMO-${Math.floor(100000 + Math.random() * 900000)}` }));
  };

  const clearDemoValues = (inst: any) => {
    const e = inst.verification_scale_interval_e;
    const max = inst.max_capacity;
    const min = inst.min_capacity;
    const testPoints = [
      { load_target: min || 1.0, standard_value: min || 1.0, observed_value: "" },
      { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: "" },
      { load_target: Math.round(0.5 * max), standard_value: Math.round(0.5 * max), observed_value: "" },
      { load_target: max, standard_value: max, observed_value: "" },
    ];
    setIndicationTests(testPoints);
    const half = Math.round(0.5 * max);
    setRepeatability({ test_load: String(half), r1: "", r2: "", r3: "" });
    const eccLoad = Math.round(0.3 * max);
    setEccentricity(EMPTY_ECCENTRICITY.map(p => ({ ...p, standard_value: eccLoad })));
    setDiscrimination({ test_load: String(half), base_indication: "", extra_load_applied: String(parseFloat((1.4 * e).toFixed(6))), new_indication: "", indication_incremented: true });
    setTare({ gross_load: "", tare_load: "", observed_net: "", tare_visibility_verified: true });
    setZeroTest({ zero_before: "", zero_after: "", stable_zero_indicator: true, zero_tracking_active: true });
    setZeroReturn({ zero_after_unloading: "", zero_return_stable: true });
    setSeals(prev => ({ ...prev, seal_number: "" }));
  };

  useEffect(() => { loadData(); }, [applicationId]);

  const handleDemoToggle = () => {
    const inst = app?.instrument;
    if (!inst) return;
    if (!isDemoMode) { fillDemoValues(inst); setIsDemoMode(true); }
    else { clearDemoValues(inst); setIsDemoMode(false); }
  };

  const handleRunVerification = async () => {
    try {
      setExecuting(true);
      const payload = {
        visual_inspection: visual,
        zero_test: {
          zero_before: parseFloat(String(zeroTest.zero_before)) || 0,
          zero_after: parseFloat(String(zeroTest.zero_after)) || 0,
          stable_zero_indicator: zeroTest.stable_zero_indicator,
          zero_tracking_active: zeroTest.zero_tracking_active
        },
        indication_tests: indicationTests.map(t => ({
          load_target: parseFloat(t.load_target),
          standard_value: parseFloat(t.standard_value),
          observed_value: parseFloat(String(t.observed_value)),
        })),
        repeatability_test: {
          test_load: parseFloat(String(repeatability.test_load)),
          readings: [
            parseFloat(String(repeatability.r1)),
            parseFloat(String(repeatability.r2)),
            parseFloat(String(repeatability.r3))
          ]
        },
        eccentricity_test: eccentricity.map(p => ({
          position: p.position,
          standard_value: parseFloat(String(p.standard_value)),
          observed_value: parseFloat(String(p.observed_value))
        })),
        discrimination_test: {
          test_load: parseFloat(String(discrimination.test_load)),
          base_indication: parseFloat(String(discrimination.base_indication)),
          extra_load_applied: parseFloat(String(discrimination.extra_load_applied)),
          new_indication: parseFloat(String(discrimination.new_indication)),
          indication_incremented: discrimination.indication_incremented
        },
        tare_test: {
          gross_load: parseFloat(String(tare.gross_load)),
          tare_load: parseFloat(String(tare.tare_load)),
          observed_net: parseFloat(String(tare.observed_net)),
          tare_visibility_verified: tare.tare_visibility_verified
        },
        zero_return_test: {
          zero_after_unloading: parseFloat(String(zeroReturn.zero_after_unloading)) || 0,
          zero_return_stable: zeroReturn.zero_return_stable
        },
        seal_record: seals,
        standard_asset_ids: selectedStandardIds,
        test_location: app?.test_centre_or_premises || "Trader Premises",
        is_demo_mode: isDemoMode
      };
      const res = await api.completeInspection(applicationId, payload);
      setResult(res);
      await loadData();
    } catch (err: any) {
      alert("Verification engine error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const cert = await api.generateCertificate(applicationId);
      setCertData(cert);
    } catch (err: any) {
      alert("Certificate generation error: " + err.message);
    }
  };

  if (loading || !app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
        <RotateCcw className="w-5 h-5 animate-spin text-blue-500" />
        <span className="font-mono text-xs tracking-widest">LOADING INSPECTION PARAMETERS…</span>
      </div>
    );
  }

  const inst = app.instrument;

  return (
    <div className="space-y-0 pb-16 w-full max-w-[1400px] mx-auto">
      {/* ── HEADER ROW ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <button onClick={onBack} className="font-mono text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition">
            <ChevronLeft className="w-3 h-3" /> INSPECTOR WORKSTATION
          </button>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Statutory Metrological Inspection</h2>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-slate-300">{inst?.manufacturer} {inst?.model}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">SN: {inst?.serial_number}</span>
            <span className="text-slate-600">·</span>
            <span className="text-blue-400 font-bold">{inst?.accuracy_class?.replace("_", " ")}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{app.application_id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode indicator — always visible */}
          <button
            onClick={handleDemoToggle}
            className={`flex items-center gap-2 px-4 py-2 border font-mono text-xs font-bold tracking-wider transition ${
              isDemoMode
                ? "bg-amber-950 border-amber-600 text-amber-300 hover:bg-amber-900"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isDemoMode ? (
              <><AlertTriangle className="w-3.5 h-3.5" /> DEMO MODE — SYNTHETIC VALUES</>
            ) : (
              <><Scale className="w-3.5 h-3.5" /> MANUAL ENTRY — FIELD READINGS</>
            )}
          </button>
        </div>
      </div>

      {/* Demo warning banner */}
      {isDemoMode && (
        <div className="mb-4 border border-amber-700 bg-amber-950/50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-amber-300">
            DEMO MODE ACTIVE — Pre-filled synthetic values are for demonstration only and must not be used as real metrological inspection records. Switch to MANUAL ENTRY before recording actual field measurements.
          </p>
        </div>
      )}

      {/* ── INSTRUMENT SPECS RAIL ────────────────────────────────────────── */}
      <div className="border border-slate-800 mb-6">
        <div className="border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <span className="font-mono text-xs text-slate-400 font-bold tracking-widest">INSTRUMENT SPECIFICATION</span>
          <span className="font-mono text-[11px] text-blue-400">Legal Metrology (General) Rules 2011 — Amended 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-800">
          {[
            { label: "MAX CAPACITY", value: `${inst?.max_capacity} ${inst?.unit}` },
            { label: "MIN CAPACITY", value: `${inst?.min_capacity} ${inst?.unit}` },
            { label: "SCALE INTERVAL e", value: `${inst?.verification_scale_interval_e} ${inst?.unit}` },
            { label: "ACTUAL INTERVAL d", value: `${inst?.actual_scale_interval_d} ${inst?.unit}` },
            { label: "ACCURACY CLASS", value: inst?.accuracy_class?.replace("_", " ") },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3">
              <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
              <div className="font-mono font-bold text-white text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-ZONE INSPECTION LAYOUT ─────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-0 border border-slate-800 min-h-[70vh]">

        {/* LEFT: Step Rail */}
        <div className="col-span-12 md:col-span-3 border-r border-slate-800 bg-[#05080e]">
          <div className="border-b border-slate-800 px-4 py-3">
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">TEST WORKFLOW</span>
          </div>
          <nav className="py-2">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isDone = result != null;
              return (
                <button
                  key={step.key}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-l-2 ${
                    isActive
                      ? "border-blue-500 bg-blue-950/30 text-white"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
                  }`}
                >
                  <span className={`font-mono text-xs ${isActive ? "text-blue-400" : "text-slate-600"}`}>{step.num}</span>
                  <span className="font-mono text-xs font-bold tracking-wider">{step.label}</span>
                  {isDone && (
                    <span className="ml-auto">
                      {result.is_pass
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <Minus className="w-3.5 h-3.5 text-slate-600" />
                      }
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Standards Linked */}
          <div className="border-t border-slate-800 p-4 space-y-2">
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-2">STANDARD ASSETS</div>
            {standards.filter((s: any) => s.status === "ACTIVE").map((s: any) => (
              <label key={s.standard_asset_id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStandardIds.includes(s.standard_asset_id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStandardIds(prev => [...prev, s.standard_asset_id]);
                    else setSelectedStandardIds(prev => prev.filter(id => id !== s.standard_asset_id));
                  }}
                  className="w-3 h-3 accent-blue-600"
                />
                <div>
                  <div className="font-mono text-[11px] text-slate-300">{s.standard_asset_id}</div>
                  <div className="font-mono text-[10px] text-slate-500">{s.nominal_mass}{s.unit} {s.accuracy_class}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* CENTER: Current Step Input */}
        <div className="col-span-12 md:col-span-6 border-r border-slate-800 bg-[#080c14]">
          <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">MEASUREMENT INPUT</span>
            <span className="font-mono text-xs text-blue-400 font-bold">{STEPS[activeStep].num} — {STEPS[activeStep].label}</span>
          </div>

          <div className="p-6 space-y-6">
            {/* ── STEP 01: VISUAL ── */}
            {activeStep === 0 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Metrological Identity Inspection</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Verify the physical identity and integrity of the instrument prior to metrological testing. All items must be confirmed.</p>
                <div className="space-y-3">
                  {[
                    { key: "nameplate_intact", label: "Nameplate & Approval Mark Intact" },
                    { key: "markings_legible", label: "Verification Marks Legible" },
                    { key: "serial_matches_application", label: "Serial Number Matches Application" },
                    { key: "level_indicator_centered", label: "Level Indicator Centered" },
                    { key: "sealing_provision_intact", label: "Sealing Provision Intact" },
                    { key: "physical_condition_acceptable", label: "Physical Condition Acceptable" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between border border-slate-800 px-4 py-3 hover:border-slate-700 cursor-pointer transition">
                      <span className="text-sm text-slate-300 font-medium">{label}</span>
                      <div className="flex gap-3">
                        {[true, false].map(val => (
                          <button
                            key={String(val)}
                            onClick={() => setVisual(prev => ({ ...prev, [key]: val }))}
                            className={`px-3 py-1 text-xs font-mono font-bold border transition ${
                              (visual as any)[key] === val
                                ? val ? "bg-emerald-950 border-emerald-600 text-emerald-300" : "bg-rose-950 border-rose-600 text-rose-300"
                                : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
                            }`}
                          >
                            {val ? "PASS" : "FAIL"}
                          </button>
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Inspection notes (optional)..."
                  value={visual.notes}
                  onChange={(e) => setVisual(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#05080e] border border-slate-800 px-4 py-3 text-sm text-slate-300 font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>
            )}

            {/* ── STEP 02: ZERO ── */}
            {activeStep === 1 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Zero Setting Accuracy</h3>
                <p className="text-xs text-slate-400">Confirm zero reading before and after loading. Zero tracking must be within ±0.25e.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "zero_before", label: "ZERO BEFORE LOAD", unit: inst?.unit },
                    { key: "zero_after", label: "ZERO AFTER LOAD", unit: inst?.unit },
                  ].map(({ key, label, unit }) => (
                    <div key={key} className="space-y-2">
                      <label className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">{label}</label>
                      <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                        <input
                          type="number"
                          step="any"
                          value={(zeroTest as any)[key]}
                          onChange={(e) => setZeroTest(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 bg-transparent px-4 py-3 font-mono text-xl font-bold text-white focus:outline-none"
                          placeholder="0.000"
                        />
                        <span className="font-mono text-xs text-slate-500 px-3">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  {[
                    { key: "stable_zero_indicator", label: "Zero Indicator Stable" },
                    { key: "zero_tracking_active", label: "Zero Tracking Active" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 border border-slate-800 px-4 py-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(zeroTest as any)[key]}
                        onChange={(e) => setZeroTest(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 03: LOAD INDICATION TESTS ── */}
            {activeStep === 2 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Load Indication Tests</h3>
                <p className="text-xs text-slate-400">Apply standard weights at Min, 500e, 2000e, and Max load points. Record actual instrument reading.</p>
                {indicationTests.map((t, i) => {
                  const err = parseFloat(String(t.observed_value)) - parseFloat(String(t.standard_value));
                  const hasValue = t.observed_value !== "" && !isNaN(parseFloat(String(t.observed_value)));
                  return (
                    <div key={i} className="border border-slate-800 p-4 space-y-3 bg-[#05080e]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-400">LOAD POINT {i + 1}</span>
                        <span className="font-mono text-sm font-bold text-white">{t.standard_value} {inst?.unit}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-slate-600 tracking-widest">OBSERVED INDICATION</label>
                        <div className="flex items-center border border-slate-700 bg-[#080c14] focus-within:border-blue-600 transition">
                          <input
                            type="number"
                            step="any"
                            value={t.observed_value}
                            onChange={(e) => {
                              const updated = [...indicationTests];
                              updated[i] = { ...updated[i], observed_value: e.target.value };
                              setIndicationTests(updated);
                            }}
                            placeholder="Enter observed reading..."
                            className="flex-1 bg-transparent px-4 py-2.5 font-mono text-lg font-bold text-white focus:outline-none"
                          />
                          <span className="font-mono text-xs text-slate-500 px-3">{inst?.unit}</span>
                        </div>
                      </div>
                      {hasValue && (
                        <div className="font-mono text-xs flex gap-4">
                          <span className="text-slate-500">ERROR:</span>
                          <span className={`font-bold ${Math.abs(err) > 0.1 ? "text-rose-400" : "text-emerald-400"}`}>
                            {err >= 0 ? "+" : ""}{err.toFixed(4)} {inst?.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── STEP 04: REPEATABILITY ── */}
            {activeStep === 3 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Repeatability Test</h3>
                <p className="text-xs text-slate-400">Apply same load 3 consecutive times. Range of readings must be within MPE limit.</p>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 tracking-widest">TEST LOAD</label>
                  <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                    <input
                      type="number" step="any" value={repeatability.test_load}
                      onChange={(e) => setRepeatability(prev => ({ ...prev, test_load: e.target.value }))}
                      className="flex-1 bg-transparent px-4 py-3 font-mono text-xl font-bold text-white focus:outline-none"
                      placeholder="Load value..."
                    />
                    <span className="font-mono text-xs text-slate-500 px-3">{inst?.unit}</span>
                  </div>
                </div>
                {(["r1", "r2", "r3"] as const).map((key, i) => (
                  <div key={key} className="space-y-1">
                    <label className="font-mono text-[10px] text-slate-500 tracking-widest">RUN 0{i + 1}</label>
                    <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                      <input
                        type="number" step="any" value={repeatability[key]}
                        onChange={(e) => setRepeatability(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Observed reading..."
                        className="flex-1 bg-transparent px-4 py-3 font-mono text-xl font-bold text-white focus:outline-none"
                      />
                      <span className="font-mono text-xs text-slate-500 px-3">{inst?.unit}</span>
                    </div>
                  </div>
                ))}
                {[repeatability.r1, repeatability.r2, repeatability.r3].every(r => r !== "" && !isNaN(parseFloat(String(r)))) && (
                  <div className="border border-slate-800 p-4 bg-[#05080e] font-mono text-sm space-y-2">
                    {(() => {
                      const readings = [parseFloat(String(repeatability.r1)), parseFloat(String(repeatability.r2)), parseFloat(String(repeatability.r3))];
                      const range = Math.max(...readings) - Math.min(...readings);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">RANGE</span>
                            <span className="font-bold text-white">{range.toFixed(4)} {inst?.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">MPE LIMIT</span>
                            <span className="text-blue-400 font-bold">±{inst?.verification_scale_interval_e} {inst?.unit}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 05: ECCENTRICITY ── */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-white">Eccentricity Test — 5 Positions</h3>
                <p className="text-xs text-slate-400">Apply 1/3 Max load to each of 5 positions on the weighing platform.</p>
                {eccentricity.map((pos, i) => (
                  <div key={pos.position} className="border border-slate-800 p-4 bg-[#05080e] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400 font-bold">POSITION: {pos.position.replace("_", " ")}</span>
                      <span className="font-mono text-xs text-slate-500">STD: {pos.standard_value} {inst?.unit}</span>
                    </div>
                    <div className="flex items-center border border-slate-700 bg-[#080c14] focus-within:border-blue-600 transition">
                      <input
                        type="number" step="any" value={pos.observed_value}
                        onChange={(e) => {
                          const updated = [...eccentricity];
                          updated[i] = { ...updated[i], observed_value: e.target.value };
                          setEccentricity(updated);
                        }}
                        placeholder="Observed reading..."
                        className="flex-1 bg-transparent px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none"
                      />
                      <span className="font-mono text-xs text-slate-500 px-3">{inst?.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 06: DISCRIMINATION ── */}
            {activeStep === 5 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Discrimination Threshold Test</h3>
                <p className="text-xs text-slate-400">Add 1.4d to a stabilized indication. The display must change by at least 1d.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "test_load", label: "TEST LOAD" },
                    { key: "base_indication", label: "BASE INDICATION" },
                    { key: "extra_load_applied", label: "EXTRA LOAD (+1.4d)" },
                    { key: "new_indication", label: "NEW INDICATION" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</label>
                      <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                        <input
                          type="number" step="any" value={(discrimination as any)[key]}
                          onChange={(e) => setDiscrimination(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="0.000"
                          className="flex-1 bg-transparent px-4 py-3 font-mono text-base font-bold text-white focus:outline-none"
                        />
                        <span className="font-mono text-[11px] text-slate-500 px-2">{inst?.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-3 border border-slate-800 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox" checked={discrimination.indication_incremented}
                    onChange={(e) => setDiscrimination(prev => ({ ...prev, indication_incremented: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-300">Indication incremented by at least 1d</span>
                </label>
              </div>
            )}

            {/* ── STEP 07: TARE ── */}
            {activeStep === 6 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Tare Weighing Test</h3>
                <p className="text-xs text-slate-400">Verify tare subtraction is correct and net indication is within MPE.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: "gross_load", label: "GROSS LOAD" },
                    { key: "tare_load", label: "TARE LOAD" },
                    { key: "observed_net", label: "OBSERVED NET" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</label>
                      <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                        <input
                          type="number" step="any" value={(tare as any)[key]}
                          onChange={(e) => setTare(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="0.000"
                          className="flex-1 bg-transparent px-4 py-3 font-mono text-base font-bold text-white focus:outline-none"
                        />
                        <span className="font-mono text-[11px] text-slate-500 px-2">{inst?.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-3 border border-slate-800 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox" checked={tare.tare_visibility_verified}
                    onChange={(e) => setTare(prev => ({ ...prev, tare_visibility_verified: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-300">Tare indication clearly visible</span>
                </label>
              </div>
            )}

            {/* ── STEP 08: ZERO RETURN ── */}
            {activeStep === 7 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Zero Return Test</h3>
                <p className="text-xs text-slate-400">After removing all loads, the instrument must return to zero within ±0.25e.</p>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 tracking-widest">ZERO READING AFTER UNLOADING</label>
                  <div className="flex items-center border border-slate-800 bg-[#05080e] focus-within:border-blue-600 transition">
                    <input
                      type="number" step="any" value={zeroReturn.zero_after_unloading}
                      onChange={(e) => setZeroReturn(prev => ({ ...prev, zero_after_unloading: e.target.value }))}
                      className="flex-1 bg-transparent px-4 py-3 font-mono text-xl font-bold text-white focus:outline-none"
                      placeholder="0.000"
                    />
                    <span className="font-mono text-xs text-slate-500 px-3">{inst?.unit}</span>
                  </div>
                </div>
                <label className="flex items-center gap-3 border border-slate-800 px-4 py-3 cursor-pointer">
                  <input
                    type="checkbox" checked={zeroReturn.zero_return_stable}
                    onChange={(e) => setZeroReturn(prev => ({ ...prev, zero_return_stable: e.target.checked }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-slate-300">Zero stable after unloading</span>
                </label>
              </div>
            )}

            {/* ── STEP 09: SEALING ── */}
            {activeStep === 8 && (
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-white">Sealing Record</h3>
                <p className="text-xs text-slate-400">Record the verification seal applied after satisfactory testing.</p>
                {[
                  { key: "seal_number", label: "SEAL NUMBER" },
                  { key: "seal_type", label: "SEAL TYPE" },
                  { key: "seal_location", label: "SEAL LOCATION" },
                  { key: "verification_mark_location", label: "VERIFICATION MARK LOCATION" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</label>
                    <input
                      type="text" value={(seals as any)[key]}
                      onChange={(e) => setSeals(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={label}
                      className="w-full bg-[#05080e] border border-slate-800 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(s => s - 1)}
                className="font-mono text-xs text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3 h-3" /> PREV
              </button>
              {activeStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setActiveStep(s => s + 1)}
                  className="font-mono text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                >
                  NEXT <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={handleRunVerification}
                  disabled={executing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-mono text-xs font-bold tracking-wider border border-blue-400/40 flex items-center gap-2 transition"
                >
                  {executing ? <><RotateCcw className="w-3 h-3 animate-spin" /> EXECUTING…</> : <>RUN VERIFICATION</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Instrument Context + Result */}
        <div className="col-span-12 md:col-span-3 bg-[#05080e] flex flex-col">
          <div className="border-b border-slate-800 px-4 py-3">
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">INSTRUMENT CONTEXT</span>
          </div>

          {/* Key metrics large */}
          <div className="p-4 space-y-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">CLASS</div>
              <div className="font-display text-xl font-bold text-white">{inst?.accuracy_class?.replace("_", " ")}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "MAX", val: inst?.max_capacity, unit: inst?.unit },
                { label: "MIN", val: inst?.min_capacity, unit: inst?.unit },
                { label: "e", val: inst?.verification_scale_interval_e, unit: inst?.unit },
              ].map(({ label, val, unit }) => (
                <div key={label} className="text-center border border-slate-800 py-2">
                  <div className="font-mono text-[10px] text-slate-600">{label}</div>
                  <div className="font-mono text-sm font-bold text-slate-200">{val}</div>
                  <div className="font-mono text-[10px] text-slate-500">{unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Owner details */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <div className="font-mono text-[10px] text-slate-600 tracking-widest uppercase">OWNER</div>
            <div className="font-mono text-xs text-slate-300">{inst?.owner_name}</div>
            <div className="font-mono text-[11px] text-slate-500">{inst?.business_name}</div>
            <div className="font-mono text-[11px] text-slate-500">{inst?.district}, {inst?.division}</div>
          </div>

          {/* Inspection Result */}
          {result && (
            <div className={`p-4 border-t border-slate-800 space-y-3 flex-1 ${result.is_pass ? "bg-emerald-950/20" : "bg-rose-950/20"}`}>
              <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">INSPECTION RESULT</div>

              <div className={`flex items-center gap-2 font-display font-extrabold text-2xl ${result.is_pass ? "text-emerald-400" : "text-rose-400"}`}>
                {result.is_pass ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {result.final_result}
              </div>

              {result.max_observed_error !== undefined && (
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">MAX ERROR</span>
                    <span className="font-bold text-white">{Number(result.max_observed_error).toFixed(4)} {inst?.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MPE LIMIT</span>
                    <span className="text-blue-400 font-bold">±{Number(result.max_error_mpe_limit).toFixed(4)} {inst?.unit}</span>
                  </div>
                </div>
              )}

              {result.failed_reasons?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-mono text-[10px] text-rose-500 tracking-widest">FAILED TESTS</div>
                  {result.failed_reasons.map((r: string, i: number) => (
                    <div key={i} className="font-mono text-[11px] text-rose-300 leading-relaxed">• {r}</div>
                  ))}
                </div>
              )}

              {result.is_pass && !certData && (
                <button
                  onClick={handleIssueCertificate}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs font-bold tracking-wider border border-emerald-500/40 flex items-center justify-center gap-2 transition mt-2"
                >
                  <FileText className="w-3.5 h-3.5" /> GENERATE SCHEDULE IX CERTIFICATE
                </button>
              )}

              {certData && (
                <div className="border border-emerald-800 bg-emerald-950/30 p-3 space-y-2">
                  <div className="font-mono text-[10px] text-emerald-400 tracking-widest">CERTIFICATE ISSUED</div>
                  <div className="font-mono text-xs text-white font-bold">{certData.certificate_number}</div>
                  <div className="font-mono text-[10px] text-slate-400 break-all">{certData.certificate_hash?.slice(0, 32)}…</div>
                  <a
                    href={`/api/certificates/${certData.certificate_id}/pdf`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 font-mono text-xs hover:underline"
                  >
                    <Download className="w-3 h-3" /> DOWNLOAD PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
