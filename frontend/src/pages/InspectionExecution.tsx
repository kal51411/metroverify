import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Scale, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Play, RotateCcw, FileText, Download, QrCode, Lock, ChevronRight,
  Sparkles, CheckSquare, Square, RefreshCw
} from "lucide-react";

interface InspectionExecutionProps {
  applicationId: number;
  onBack: () => void;
}

export const InspectionExecution: React.FC<InspectionExecutionProps> = ({ applicationId, onBack }) => {
  const { t } = useLanguage();
  const [app, setApp] = useState<any | null>(null);
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [generatedCert, setGeneratedCert] = useState<any | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. Visual Inspection
  const [visual, setVisual] = useState({
    nameplate_intact: true,
    markings_legible: true,
    serial_matches_application: true,
    level_indicator_centered: true,
    sealing_provision_intact: true,
    physical_condition_acceptable: true,
    notes: ""
  });

  // 2. Zero Test
  const [zeroTest, setZeroTest] = useState({
    zero_before: 0.0,
    zero_after: 0.0,
    stable_zero_indicator: true,
    zero_tracking_active: true
  });

  // 3. Indication Tests
  const [indicationTests, setIndicationTests] = useState<any[]>([]);

  // 4. Repeatability Test
  const [repeatability, setRepeatability] = useState({
    test_load: 50.0,
    r1: 50.040,
    r2: 50.042,
    r3: 50.041
  });

  // 5. Eccentricity Test (5 Points)
  const [eccentricity, setEccentricity] = useState<any[]>([
    { position: "CENTER", standard_value: 50.0, observed_value: 50.040 },
    { position: "TOP_LEFT", standard_value: 50.0, observed_value: 50.045 },
    { position: "TOP_RIGHT", standard_value: 50.0, observed_value: 50.038 },
    { position: "BOTTOM_LEFT", standard_value: 50.0, observed_value: 50.042 },
    { position: "BOTTOM_RIGHT", standard_value: 50.0, observed_value: 50.044 },
  ]);

  // 6. Discrimination Test
  const [discrimination, setDiscrimination] = useState({
    test_load: 50.0,
    base_indication: 50.00,
    extra_load_applied: 0.014,
    new_indication: 50.01,
    indication_incremented: true
  });

  // 7. Tare Test
  const [tare, setTare] = useState({
    gross_load: 50.0,
    tare_load: 10.0,
    observed_net: 40.01,
    tare_visibility_verified: true
  });

  // 8. Zero Return Test
  const [zeroReturn, setZeroReturn] = useState({
    zero_after_unloading: 0.005,
    zero_return_stable: true
  });

  // 9. Sealing Record
  const [seals, setSeals] = useState({
    seal_number: `MH-LM-SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
    seal_type: "WIRE_SECURITY_SEAL",
    seal_location: "JUNCTION_BOX_AND_CALIBRATION_PORT",
    verification_mark_location: "FRONT_NAMEPLATE",
    condition: "INTACT"
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
      
      const activeStdIds = stds.filter(s => s.status === "ACTIVE").map(s => s.standard_asset_id);
      setSelectedStandardIds(activeStdIds.slice(0, 2));

      const inst = appData.instrument;
      if (inst) {
        const e = inst.verification_scale_interval_e;
        const max = inst.max_capacity;
        const min = inst.min_capacity;
        
        const testPoints = [
          { load_target: min || 1.0, standard_value: min || 1.0, observed_value: (min || 1.0) + 0.005 },
          { load_target: Math.round(500 * e), standard_value: Math.round(500 * e), observed_value: Math.round(500 * e) + 0.015 },
          { load_target: Math.round(0.5 * max), standard_value: Math.round(0.5 * max), observed_value: Math.round(0.5 * max) + 0.041 },
          { load_target: max, standard_value: max, observed_value: max + 0.050 }
        ];
        setIndicationTests(testPoints);
        setRepeatability(prev => ({ ...prev, test_load: Math.round(0.5 * max) }));
      }
    } catch (err) {
      console.error("Error loading application for inspection:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const handleRunVerification = async () => {
    try {
      setExecuting(true);
      const payload = {
        visual_inspection: visual,
        zero_test: zeroTest,
        indication_tests: indicationTests,
        repeatability_test: {
          test_load: repeatability.test_load,
          readings: [repeatability.r1, repeatability.r2, repeatability.r3]
        },
        eccentricity_test: eccentricity,
        discrimination_test: discrimination,
        tare_test: tare,
        zero_return_test: zeroReturn,
        seal_record: seals,
        standard_asset_ids: selectedStandardIds,
        test_location: app?.test_centre_or_premises || "Trader Premises",
        is_demo_mode: isDemoMode
      };

      const res = await api.completeInspection(applicationId, payload);
      setInspectionResult(res);
      loadData();
    } catch (err: any) {
      alert("Verification Engine Execution Error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const cert = await api.generateCertificate(applicationId);
      setGeneratedCert(cert);
      alert(`Schedule IX Certificate ${cert.certificate_number} issued successfully!`);
      loadData();
    } catch (err: any) {
      alert("Error issuing certificate: " + err.message);
    }
  };

  if (loading || !app) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading inspection parameters & test template...
      </div>
    );
  }

  const inst = app.instrument;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <button onClick={onBack} className="text-xs text-blue-400 hover:underline mb-1 block">
            ← Back to Inspector Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Statutory Metrological Inspection Runner</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              {app.application_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Instrument: <b>{inst?.manufacturer} {inst?.model}</b> [SN: <span className="font-mono">{inst?.serial_number}</span>] | Class: <b>{inst?.accuracy_class}</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Mode:</span>
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`px-2 py-0.5 rounded font-bold transition ${
                isDemoMode ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
              }`}
            >
              {isDemoMode ? "DEMO MODE" : "MANUAL ENTRY"}
            </button>
          </div>
        </div>
      </div>

      {/* Target Metrological Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">Verification Scale Interval (e)</span>
          <span className="text-base font-mono font-bold text-blue-400">{inst?.verification_scale_interval_e} {inst?.unit}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Actual Scale Interval (d)</span>
          <span className="text-base font-mono font-bold text-slate-200">{inst?.actual_scale_interval_d} {inst?.unit}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Capacity Range (Min / Max)</span>
          <span className="text-base font-mono font-bold text-slate-200">{inst?.min_capacity} to {inst?.max_capacity} {inst?.unit}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Applicable MPE Ruleset</span>
          <span className="text-xs font-semibold text-emerald-400">Legal Metrology (General) 2011 (Amended 2026)</span>
        </div>
      </div>

      {/* Step 1: Visual & Identity Inspection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">1</span>
            <h3 className="text-sm font-bold text-white">Visual & Metrological Identity Inspection</h3>
          </div>
          <span className="text-[11px] text-slate-400">Mandatory statutory checklist</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { id: "nameplate_intact", label: "Manufacturer nameplate intact & secure", key: "nameplate_intact" },
            { id: "markings_legible", label: "Mandatory markings (Max, Min, e, d) legible", key: "markings_legible" },
            { id: "serial_matches_application", label: "Serial number matches application", key: "serial_matches_application" },
            { id: "level_indicator_centered", label: "Level spirit bubble indicator centered", key: "level_indicator_centered" },
            { id: "sealing_provision_intact", label: "Sealing arrangement & lead holes intact", key: "sealing_provision_intact" },
            { id: "physical_condition_acceptable", label: "Load receptor free of corrosion/damage", key: "physical_condition_acceptable" },
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => setVisual({ ...visual, [item.key]: !(visual as any)[item.key] })}
              className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition ${
                (visual as any)[item.key]
                  ? "bg-blue-950/20 border-blue-800/80 text-slate-200"
                  : "bg-rose-950/20 border-rose-800 text-rose-300"
              }`}
            >
              <input
                type="checkbox"
                checked={(visual as any)[item.key]}
                onChange={() => {}}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Zero Setting & Stability Test */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">2</span>
            <h3 className="text-sm font-bold text-white">Zero Setting & Stability Test (Max Dev: ±0.25e)</h3>
          </div>
          <span className="font-mono text-xs text-blue-400">Limit: ±{(0.25 * (inst?.verification_scale_interval_e || 0.05)).toFixed(4)} {inst?.unit}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Zero Reading Before Loading ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={zeroTest.zero_before}
              onChange={(e) => setZeroTest({ ...zeroTest, zero_before: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Zero Reading After Zeroing ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={zeroTest.zero_after}
              onChange={(e) => setZeroTest({ ...zeroTest, zero_after: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={zeroTest.stable_zero_indicator}
                onChange={(e) => setZeroTest({ ...zeroTest, stable_zero_indicator: e.target.checked })}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Zero Center / Stability Indicator Active</span>
            </label>
          </div>
        </div>
      </div>

      {/* Step 3: Weighing Performance & Indication Error (MPE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">3</span>
            <h3 className="text-sm font-bold text-white">Weighing Performance & Indication Error (MPE Table)</h3>
          </div>
          <span className="text-xs text-slate-400">Class {inst?.accuracy_class} MPE Progression</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-2.5">Test Point</th>
                <th className="p-2.5">Standard Load ({inst?.unit})</th>
                <th className="p-2.5">Observed Indication ({inst?.unit})</th>
                <th className="p-2.5">Observed Error</th>
                <th className="p-2.5">Permissible MPE</th>
                <th className="p-2.5">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {indicationTests.map((tRow, idx) => {
                const err = Math.round((tRow.observed_value - tRow.standard_value) * 10000) / 10000;
                const e = inst?.verification_scale_interval_e || 0.05;
                const intervals = tRow.standard_value / e;
                const mpeFactor = intervals <= 500 ? 0.5 : intervals <= 2000 ? 1.0 : 1.5;
                const mpeVal = Math.round(mpeFactor * e * 10000) / 10000;
                const isPass = Math.abs(err) <= mpeVal + 1e-9;

                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-slate-300 font-sans">Point #{idx + 1}</td>
                    <td className="p-2.5 text-blue-400 font-bold">{tRow.standard_value}</td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        value={tRow.observed_value}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...indicationTests];
                          updated[idx].observed_value = val;
                          setIndicationTests(updated);
                        }}
                        className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </td>
                    <td className={`p-2.5 font-bold ${err >= 0 ? "text-amber-400" : "text-blue-400"}`}>
                      {err >= 0 ? `+${err}` : err} {inst?.unit}
                    </td>
                    <td className="p-2.5 text-slate-300">
                      ±{mpeVal} {inst?.unit} ({mpeFactor}e)
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPass ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}>
                        {isPass ? "PASS" : "FAIL (OUT OF MPE)"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 4: Repeatability Test */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">4</span>
            <h3 className="text-sm font-bold text-white">Repeatability Test (3 Consecutive Runs)</h3>
          </div>
          <span className="text-xs text-slate-400">Max range minus min range ≤ MPE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Test Load ({inst?.unit})</label>
            <input
              type="number"
              value={repeatability.test_load}
              onChange={(e) => setRepeatability({ ...repeatability, test_load: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Run #1 ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={repeatability.r1}
              onChange={(e) => setRepeatability({ ...repeatability, r1: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans font-sans font-sans">Run #2 ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={repeatability.r2}
              onChange={(e) => setRepeatability({ ...repeatability, r2: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-sans">Run #3 ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={repeatability.r3}
              onChange={(e) => setRepeatability({ ...repeatability, r3: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        {(() => {
          const vals = [repeatability.r1, repeatability.r2, repeatability.r3];
          const repRange = Math.round((Math.max(...vals) - Math.min(...vals)) * 10000) / 10000;
          const e = inst?.verification_scale_interval_e || 0.05;
          const mpe = Math.round(1.0 * e * 10000) / 10000;
          const pass = repRange <= mpe + 1e-9;
          return (
            <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              pass ? "bg-emerald-950/20 border-emerald-800/80 text-emerald-300" : "bg-rose-950/20 border-rose-800 text-rose-300"
            }`}>
              <span>Calculated Repeatability Error: <b>{repRange} {inst?.unit}</b> (Permissible Limit: <b>{mpe} {inst?.unit}</b>)</span>
              <span className="font-bold">{pass ? "✓ PASS" : "✗ EXCEEDS MPE"}</span>
            </div>
          );
        })()}
      </div>

      {/* Step 5: Eccentric Loading Test (Plate Visualizer) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">5</span>
            <h3 className="text-sm font-bold text-white">Eccentric Loading Test (Corner Off-Center Loading)</h3>
          </div>
          <span className="text-xs text-slate-400">1/3 Max Load on 5 Positions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative h-56">
            <div className="w-full text-center text-[11px] text-slate-500 font-semibold mb-2 uppercase">Load Receptor Top View</div>
            <div className="w-48 h-36 border-2 border-dashed border-blue-500/60 rounded-lg relative bg-slate-900/80 flex items-center justify-center">
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono">
                TL
              </div>
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono">
                TR
              </div>
              <div className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px] font-mono shadow-md">
                CTR
              </div>
              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono">
                BL
              </div>
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono">
                BR
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {eccentricity.map((ecc, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300 w-28">{ecc.position}</span>
                <span className="text-slate-500 font-mono text-[11px]">{ecc.standard_value} {inst?.unit}</span>
                <input
                  type="number"
                  step="any"
                  value={ecc.observed_value}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const updated = [...eccentricity];
                    updated[idx].observed_value = val;
                    setEccentricity(updated);
                  }}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 6 & 7: Discrimination & Zero Return */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">6</span>
            <h3 className="text-xs font-bold text-white">Discrimination Test (1.4d Addition)</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Load: <b>{discrimination.test_load} {inst?.unit}</b></span>
              <span>1.4d Extra Mass: <b>{discrimination.extra_load_applied} {inst?.unit}</b></span>
            </div>
            <label className="flex items-center gap-2 bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={discrimination.indication_incremented}
                onChange={(e) => setDiscrimination({ ...discrimination, indication_incremented: e.target.checked })}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Indication changed unambiguously by expected scale interval (+1d)</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">7</span>
            <h3 className="text-xs font-bold text-white">Zero Return Test (Max Dev: ±0.5e)</h3>
          </div>
          <div className="space-y-2 text-xs">
            <label className="text-slate-400 block mb-1">Residual Indication After Load Removal ({inst?.unit})</label>
            <input
              type="number"
              step="any"
              value={zeroReturn.zero_after_unloading}
              onChange={(e) => setZeroReturn({ ...zeroReturn, zero_after_unloading: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Step 8: Physical Sealing & Stamp Recording */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-950 text-blue-400 font-bold flex items-center justify-center text-xs">8</span>
            <h3 className="text-sm font-bold text-white">Verification Stamp & Security Seal Record</h3>
          </div>
          <span className="text-xs text-slate-400">Tamper-evident verification record</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Official Seal Number</label>
            <input
              type="text"
              value={seals.seal_number}
              onChange={(e) => setSeals({ ...seals, seal_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Seal Type</label>
            <select
              value={seals.seal_type}
              onChange={(e) => setSeals({ ...seals, seal_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            >
              <option value="WIRE_SECURITY_SEAL">Wire Security Seal</option>
              <option value="LEAD_SEAL">Lead Metrology Seal</option>
              <option value="TAMPER_EVIDENT_LABEL">Tamper Evident Security Sticker</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Verification Stamp Location</label>
            <input
              type="text"
              value={seals.verification_mark_location}
              onChange={(e) => setSeals({ ...seals, verification_mark_location: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Execution Decision Action Bar */}
      <div className="bg-slate-900 border-2 border-blue-600/40 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Execute Metrological Calculation & Determine Decision</h3>
            <p className="text-xs text-slate-400">
              Evaluates all raw test readings against Maharashtra/Indian legal metrology rules. Deterministic and auditable.
            </p>
          </div>
          <button
            onClick={handleRunVerification}
            disabled={executing}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
          >
            {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>Calculate Legal MPE & Pass/Fail</span>
          </button>
        </div>

        {/* Result Explanation Display */}
        {inspectionResult && (
          <div className={`mt-4 p-5 rounded-xl border space-y-3 ${
            inspectionResult.is_pass ? "bg-emerald-950/40 border-emerald-700" : "bg-rose-950/40 border-rose-700"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inspectionResult.is_pass ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Official Decision: {inspectionResult.final_result}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Inspection Ref: <span className="font-mono">{inspectionResult.inspection_ref}</span>
                  </p>
                </div>
              </div>

              {inspectionResult.is_pass && (
                <button
                  onClick={handleIssueCertificate}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Schedule IX Certificate</span>
                </button>
              )}
            </div>

            <div className="text-xs font-mono bg-slate-950/80 p-3 rounded border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed">
              {inspectionResult.decision_summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
