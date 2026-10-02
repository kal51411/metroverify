import React, { useState } from "react";
import { api } from "../api/client";
import { Activity, ShieldAlert, BarChart3 } from "lucide-react";

export const DiagnosticsPage: React.FC = () => {
  const [samplesText, setSamplesText] = useState("50.040, 50.042, 50.038, 50.041, 50.045, 50.039, 50.043, 50.040, 50.041");
  const [signalResult, setSignalResult] = useState<any | null>(null);

  const [creepLoad, setCreepLoad] = useState(90.0);
  const [creepStart, setCreepStart] = useState(90.000);
  const [creepEnd, setCreepEnd] = useState(90.018);
  const [creepDuration, setCreepDuration] = useState(30.0);
  const [creepResult, setCreepResult] = useState<any | null>(null);

  const handleAnalyzeSignal = async () => {
    try {
      const arr = samplesText.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const res = await api.analyzeSignal(arr);
      setSignalResult(res);
    } catch (err: any) {
      alert("Signal analysis error: " + err.message);
    }
  };

  const handleEvaluateCreep = async () => {
    try {
      const res = await api.evaluateCreep(creepLoad, creepStart, creepEnd, creepDuration);
      setCreepResult(res);
    } catch (err: any) {
      alert("Creep evaluation error: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-amber-950/30 border-2 border-amber-600/60 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            CRITICAL RULE: ENGINEERING DIAGNOSTICS MODULE (NON-LEGAL)
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            As mandated by system specification, load-cell noise, vibration index, SNR, and creep analysis are provided strictly for <b>engineering diagnostics and sensor health monitoring</b>. They <b>MUST NEVER</b> be turned into a statutory legal PASS/FAIL criterion unless explicitly required by an enacted metrological standard.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Load Cell Signal Stability & Vibration Analyzer</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Raw Signal Readings (Comma Separated)</label>
            <textarea
              rows={2}
              value={samplesText}
              onChange={(e) => setSamplesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white font-mono"
            />
          </div>
          <button
            onClick={handleAnalyzeSignal}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Compute Signal-to-Noise Ratio & Vibration Index
          </button>
        </div>

        {signalResult && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between text-blue-400 font-bold font-sans">
              <span>Sensor Rating: {signalResult.sensor_health_rating}</span>
              <span>Samples: {signalResult.sample_count}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
              <div>Mean: <b>{signalResult.mean_signal}</b></div>
              <div>Std Dev: <b>{signalResult.standard_deviation}</b></div>
              <div>SNR (dB): <b>{signalResult.snr_db}</b></div>
              <div>Vibration Index: <b>{signalResult.vibration_index}</b></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Load Cell Creep & Drift Diagnostic</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Test Load (kg)</label>
            <input
              type="number"
              value={creepLoad}
              onChange={(e) => setCreepLoad(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Start Reading (kg)</label>
            <input
              type="number"
              step="any"
              value={creepStart}
              onChange={(e) => setCreepStart(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">End Reading (kg)</label>
            <input
              type="number"
              step="any"
              value={creepEnd}
              onChange={(e) => setCreepEnd(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Duration (Min)</label>
            <input
              type="number"
              value={creepDuration}
              onChange={(e) => setCreepDuration(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleEvaluateCreep}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
        >
          Evaluate Creep & Drift Rate
        </button>

        {creepResult && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
            <div className="text-emerald-400 font-bold">
              Creep Drift: {creepResult.creep_drift_kg} kg ({creepResult.creep_percentage}%)
            </div>
            <div className="text-slate-300">
              Drift Rate: {creepResult.drift_rate_kg_per_min} kg/min
            </div>
            <div className="text-slate-400 font-sans italic">
              {creepResult.interpretation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
