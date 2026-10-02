import React, { useState } from "react";
import { api } from "../api/client";
import { Scale, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Info } from "lucide-react";

export const HighCapacityCalculator: React.FC = () => {
  const [maxCap, setMaxCap] = useState(60000.0);
  const [eVal, setEVal] = useState(20.0);
  const [unit, setUnit] = useState("kg");
  const [r1, setR1] = useState(30000.0);
  const [r2, setR2] = useState(30003.0);
  const [r3, setR3] = useState(30001.0);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.evaluateHighCapacity(maxCap, eVal, r1, r2, r3);
      setResult(res);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-950 text-blue-400 border border-blue-800">
            MANDATORY 2026 FOURTH AMENDMENT RULE
          </span>
          <span className="text-xs text-slate-400">Legal Metrology (General) Fourth Amendment Rules, 2026</span>
        </div>
        <h2 className="text-lg font-bold text-white">High-Capacity Weighbridge Standard Weight Substitution Engine</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          For weighing instruments tested at place of use (e.g. 60-tonne weighbridges): baseline standard weight requirement is <b>1/2 Max (50%)</b>.
          If repeatability error with substitution load is <b>≤ 0.3e</b>, standard weight portion may be reduced to <b>1/3 Max</b>.
          If repeatability error is <b>≤ 0.2e</b>, standard weight portion may be reduced to <b>1/5 Max</b>.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Weighbridge & Repeatability Test Parameters
        </h3>
        <form onSubmit={handleCalculate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Max Capacity ({unit})</label>
              <input
                type="number"
                step="any"
                required
                value={maxCap}
                onChange={(e) => setMaxCap(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Scale Interval e ({unit})</label>
              <input
                type="number"
                step="any"
                required
                value={eVal}
                onChange={(e) => setEVal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Mass Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-blue-400 block">
              Substitution Load Repeatability Test (3 Consecutive Weighings)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <label className="text-slate-500 block mb-1 font-sans text-[11px]">Run #1 Reading</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={r1}
                  onChange={(e) => setR1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-sans text-[11px]">Run #2 Reading</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={r2}
                  onChange={(e) => setR2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 font-sans text-[11px]">Run #3 Reading</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={r3}
                  onChange={(e) => setR3(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition"
          >
            Calculate Standard Weight Substitution Eligibility
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-slate-900 border-2 border-blue-600/40 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-slate-400">Eligibility Status:</span>
              <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">{result.eligibility}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Required Standard Load:</span>
              <span className="text-xl font-mono font-bold text-white">{result.required_standard_load} {result.unit}</span>
              <span className="text-xs text-blue-400 block font-semibold">{result.fraction_label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg text-xs font-mono">
            <div>
              <span className="text-slate-500 block font-sans">Repeatability Error</span>
              <span className="font-bold text-amber-400">{result.repeatability_error} {result.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">0.2e Threshold</span>
              <span className="text-slate-300">{result.threshold_02e} {result.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">0.3e Threshold</span>
              <span className="text-slate-300">{result.threshold_03e} {result.unit}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Baseline 1/2 Max</span>
              <span className="text-slate-300">{result.baseline_standard_load} {result.unit}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
            <b className="text-blue-400">Statutory Decision Summary:</b><br />
            {result.decision_reason}
          </div>
        </div>
      )}
    </div>
  );
};
