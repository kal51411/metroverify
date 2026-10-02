import React, { useState, useCallback } from "react";
import { api } from "../api/client";

interface ToleranceBandProps {
  error: number;
  mpe: number;
  unit?: string;
}

export const ToleranceBand: React.FC<ToleranceBandProps> = ({ error, mpe, unit = "kg" }) => {
  const pct = Math.min(Math.abs(error) / mpe, 1.5);
  const isPass = Math.abs(error) <= mpe;
  const barWidth = 280;
  const centerX = barWidth / 2;
  const markerX = centerX + (error / mpe) * (centerX * 0.8);
  const clampedMarkerX = Math.max(8, Math.min(barWidth - 8, markerX));

  return (
    <div className="space-y-3">
      {/* The bar */}
      <div className="relative">
        <svg viewBox={`0 0 ${barWidth} 28`} width="100%" className="overflow-visible">
          <defs>
            <linearGradient id="failGradL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="failGradR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {/* Fail zones */}
          <rect x="0" y="8" width={centerX * 0.2} height="12" fill="url(#failGradL)" rx="2" />
          <rect x={centerX + centerX * 0.8} y="8" width={centerX * 0.2} height="12" fill="url(#failGradR)" rx="2" />
          {/* Pass zone */}
          <rect x={centerX * 0.2} y="8" width={barWidth - centerX * 0.4} height="12" fill="rgba(22,163,74,0.2)" rx="2" />
          {/* MPE boundary lines */}
          <line x1={centerX * 0.2} y1="4" x2={centerX * 0.2} y2="24" stroke="rgba(22,163,74,0.6)" strokeWidth="1.5" strokeDasharray="3,2" />
          <line x1={centerX + centerX * 0.8} y1="4" x2={centerX + centerX * 0.8} y2="24" stroke="rgba(22,163,74,0.6)" strokeWidth="1.5" strokeDasharray="3,2" />
          {/* Zero center */}
          <line x1={centerX} y1="2" x2={centerX} y2="26" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Measurement marker */}
          <circle
            cx={clampedMarkerX}
            cy="14"
            r="6"
            fill={isPass ? "#16a34a" : "#dc2626"}
            stroke={isPass ? "rgba(22,163,74,0.5)" : "rgba(220,38,38,0.5)"}
            strokeWidth="2"
          />
          {/* Error labels */}
          <text x={centerX * 0.2 - 2} y="6" textAnchor="end" fill="rgba(220,38,38,0.6)" fontSize="7" fontFamily="'JetBrains Mono',monospace">
            −MPE
          </text>
          <text x={centerX + centerX * 0.8 + 2} y="6" textAnchor="start" fill="rgba(220,38,38,0.6)" fontSize="7" fontFamily="'JetBrains Mono',monospace">
            +MPE
          </text>
        </svg>
      </div>
      {/* Values */}
      <div className="grid grid-cols-3 text-center">
        <div>
          <div className="font-mono text-[10px] text-ash uppercase tracking-wider">Error</div>
          <div className={`font-mono font-bold text-base ${isPass ? "text-pass" : "text-fail"}`}>
            {error >= 0 ? "+" : ""}{error.toFixed(4)} {unit}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-ash uppercase tracking-wider">Result</div>
          <div className={`font-mono font-extrabold text-xl ${isPass ? "text-pass" : "text-fail"}`}>
            {isPass ? "PASS" : "FAIL"}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-ash uppercase tracking-wider">MPE Limit</div>
          <div className="font-mono font-bold text-base text-amber-light">
            ±{mpe.toFixed(4)} {unit}
          </div>
        </div>
      </div>
    </div>
  );
};

interface LiveMPEDemoProps {
  className?: string;
}

export const LiveMPEDemo: React.FC<LiveMPEDemoProps> = ({ className = "" }) => {
  const [stdValue, setStdValue] = useState(50.0);
  const [observed, setObserved] = useState(50.042);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>({
    mpe: 0.05,
    is_pass: true,
    error: 0.042,
  });

  const calculate = useCallback(async (std: number, obs: number) => {
    const error = obs - std;
    setLoading(true);
    try {
      // Use backend rules engine for real calculation
      const res = await api.calculateMPE(std, 0.02, "CLASS_III");
      setResult({ mpe: res.mpe, is_pass: Math.abs(error) <= res.mpe, error });
    } catch {
      // Graceful fallback using standard rule (0.1e at max cap zone = 0.05 for 50kg range)
      const mpe = std <= 500 ? 0.05 : std <= 2000 ? 0.1 : 0.2;
      setResult({ mpe, is_pass: Math.abs(error) <= mpe, error });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (type: "std" | "obs", value: number) => {
    const std = type === "std" ? value : stdValue;
    const obs = type === "obs" ? value : observed;
    if (type === "std") setStdValue(value);
    else setObserved(value);
    calculate(std, obs);
  };

  return (
    <div className={`${className} space-y-8`}>
      {/* Title */}
      <div className="space-y-2">
        <div className="font-mono text-xs text-amber uppercase tracking-widest">Live Demonstration</div>
        <h3 className="font-display text-3xl font-bold text-warm">
          Move the slider. Watch the result change.
        </h3>
        <p className="text-ash text-sm leading-relaxed">
          This uses the actual MetroVerify rules engine. Drag the observed value to cross the tolerance boundary.
        </p>
      </div>

      {/* Control panel */}
      <div className="space-y-6 bg-onyx border border-iron p-6">
        {/* Standard Reference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-silver uppercase tracking-wider">Standard Reference Weight</label>
            <span className="font-mono font-bold text-warm text-lg">{stdValue.toFixed(1)} kg</span>
          </div>
          <input
            type="range" min={10} max={200} step={10} value={stdValue}
            onChange={(e) => handleChange("std", parseFloat(e.target.value))}
            className="w-full h-1 appearance-none cursor-pointer"
            style={{ accentColor: "#d97706" }}
          />
          <div className="flex justify-between font-mono text-[10px] text-steel">
            <span>10 kg</span><span>200 kg</span>
          </div>
        </div>

        {/* Observed indication */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-silver uppercase tracking-wider">Observed Indication</label>
            <span className={`font-mono font-bold text-lg ${result?.is_pass ? "text-pass" : "text-fail"}`}>
              {observed.toFixed(3)} kg
            </span>
          </div>
          <input
            type="range" min={stdValue - 0.15} max={stdValue + 0.15} step={0.001} value={observed}
            onChange={(e) => handleChange("obs", parseFloat(e.target.value))}
            className="w-full h-1 appearance-none cursor-pointer"
            style={{ accentColor: result?.is_pass ? "#16a34a" : "#dc2626" }}
          />
          <div className="flex justify-between font-mono text-[10px] text-steel">
            <span>−0.150</span>
            <span className="text-amber">MPE ±{result?.mpe?.toFixed(3)}</span>
            <span>+0.150</span>
          </div>
        </div>
      </div>

      {/* Measurement display */}
      <div className="grid grid-cols-3 gap-px bg-iron">
        {[
          { label: "INDICATION", value: `${observed.toFixed(3)} kg`, sub: "Instrument reading" },
          { label: "REFERENCE", value: `${stdValue.toFixed(3)} kg`, sub: "Standard weight" },
          { label: "ERROR", value: `${result?.error >= 0 ? "+" : ""}${result?.error?.toFixed(4)} kg`, sub: "Indication − Reference", accent: true },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} className="bg-charcoal px-4 py-5 text-center">
            <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-2">{label}</div>
            <div className={`font-mono font-bold text-xl ${accent ? (result?.is_pass ? "text-pass" : "text-fail") : "text-warm"}`}>
              {value}
            </div>
            <div className="font-mono text-[9px] text-steel mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tolerance band */}
      {result && (
        <div className="bg-onyx border border-iron p-5 space-y-4">
          <div className="font-mono text-[10px] text-ash uppercase tracking-widest">Tolerance Evaluation</div>
          <ToleranceBand error={result.error} mpe={result.mpe} />
          <div className="font-mono text-[10px] text-steel leading-relaxed">
            Rules engine: Legal Metrology (General) Rules 2011, Schedule I – Accuracy Class III.
            MPE at {stdValue.toFixed(0)} kg load point = ±{result?.mpe?.toFixed(4)} kg.
          </div>
        </div>
      )}
    </div>
  );
};
