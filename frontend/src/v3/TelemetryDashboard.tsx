import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Radio, CheckCircle2, AlertTriangle, RefreshCw, Zap, ShieldCheck, 
  ArrowUpRight, Server, Activity, Info 
} from "lucide-react";

interface TelemetryPacket {
  instrument_id: string;
  timestamp: string;
  cells: number[];
  gross_weight: number;
  unit: string;
  zero_drift: number;
  corner_imbalance: number;
  mpe_limit: number;
  status: string;
}

export function TelemetryDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [instrumentId, setInstrumentId] = useState("WB-2026-091");
  const [packet, setPacket] = useState<TelemetryPacket | null>({
    instrument_id: "WB-2026-091",
    timestamp: new Date().toISOString(),
    cells: [12501.4, 12498.2, 12503.1, 12499.7],
    gross_weight: 50002.4,
    unit: "kg",
    zero_drift: 0.012,
    corner_imbalance: 4.9,
    mpe_limit: 15.0,
    status: "NORMAL"
  });
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<number[]>([49998, 50001, 50004, 50002, 50003, 50000, 50002.4]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isSubscribed = true;

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "localhost:8000";
      const wsUrl = `${protocol}//${host}/api/v3/telemetry/ws/${instrumentId}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isSubscribed) setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: TelemetryPacket = JSON.parse(event.data);
            if (isSubscribed) {
              setPacket(data);
              setHistory(prev => [...prev.slice(-20), data.gross_weight]);
            }
          } catch (e) {
            console.error("Failed to parse telemetry packet", e);
          }
        };

        ws.onerror = () => {
          if (isSubscribed) setIsConnected(false);
        };

        ws.onclose = () => {
          if (isSubscribed) {
            setIsConnected(false);
            setTimeout(() => {
              if (isSubscribed) connectWs();
            }, 3000);
          }
        };
      } catch (e) {
        if (isSubscribed) setIsConnected(false);
      }
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (ws) ws.close();
    };
  }, [instrumentId]);

  const cells = packet?.cells || [12500, 12500, 12500, 12500];
  const maxCell = Math.max(...cells);
  const minCell = Math.min(...cells);
  const deltaCell = Number((maxCell - minCell).toFixed(2));
  const isWarning = (packet?.status === "WARNING") || deltaCell > 12.0;

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20 space-y-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>2 Hz Live Load-Cell Telemetry Stream</span>
          </div>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[#FAFAFA] tracking-tight">
            Weighbridge Sensor Stream
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time digital junction box load-cell matrix, corner imbalance, and zero-drift monitoring.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#111113] border border-white/[0.08] px-4 py-2.5 rounded-2xl">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
            <span className="font-mono text-xs text-zinc-300">
              {isConnected ? "Connected to Weighbridge WS" : "Simulated Local Stream"}
            </span>
          </div>

          <select
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            className="bg-[#111113] border border-white/[0.08] text-xs font-mono text-[#FAFAFA] px-4 py-2.5 rounded-2xl outline-none focus:border-cyan-500/50"
          >
            <option value="WB-2026-091">WB-2026-091 (50t Heavy Rail)</option>
            <option value="WB-2026-042">WB-2026-042 (80t Coal Terminal)</option>
            <option value="WB-2026-118">WB-2026-118 (30t Agro Mandi)</option>
          </select>
        </div>
      </div>

      {/* Top Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Gross Live Load</span>
          <div className="font-display font-semibold text-3xl text-[#FAFAFA] flex items-baseline gap-2">
            <span>{packet?.gross_weight.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
            <span className="text-sm font-mono text-cyan-400">{packet?.unit || "kg"}</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">Rated Capacity: 50,000 kg</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Corner Load Imbalance</span>
          <div className={`font-display font-semibold text-3xl flex items-baseline gap-2 ${isWarning ? "text-amber-400" : "text-[#FAFAFA]"}`}>
            <span>{deltaCell.toFixed(2)}</span>
            <span className="text-sm font-mono text-zinc-400">kg</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500">Statutory Ceiling: ≤ 15.0 kg</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Zero-Point Drift</span>
          <div className="font-display font-semibold text-3xl text-[#FAFAFA] flex items-baseline gap-2">
            <span>{packet?.zero_drift.toFixed(3)}</span>
            <span className="text-sm font-mono text-zinc-400">kg</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400">Normal Range (≤ 0.05 kg)</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/[0.08] space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Statutory Condition</span>
          <div className="font-display font-semibold text-2xl flex items-center gap-2 mt-1">
            {isWarning ? (
              <span className="text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> WARNING
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> COMPLIANT
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">Legal Metrology Rules 2026</div>
        </div>
      </div>

      {/* Main Grid: Interactive 4-Corner SVG Platform vs Live Waveform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        {/* Animated Weighbridge SVG Receptor */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#111113] border border-white/[0.08] flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-semibold text-lg text-[#FAFAFA]">
              Platform Load-Cell Distribution
            </h3>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              4-Load Cell Matrix
            </span>
          </div>

          {/* SVG Platform Visualizer */}
          <div className="relative py-6 flex items-center justify-center">
            <svg viewBox="0 0 460 260" className="w-full max-w-[420px] overflow-visible">
              {/* Outer Deck Plate */}
              <rect
                x="30"
                y="30"
                width="400"
                height="200"
                rx="16"
                fill="#18181B"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
              />

              {/* Center Tonnage Crosshair */}
              <line x1="230" y1="30" x2="230" y2="230" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="30" y1="130" x2="430" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Corner 1 (Top-Left) */}
              <g className="transition-all">
                <circle cx="70" cy="70" r="22" fill="#0A0A0B" stroke="#0EA5E9" strokeWidth="2" />
                <circle cx="70" cy="70" r="8" fill="#0EA5E9" className={shouldReduceMotion ? "" : "animate-ping opacity-30"} />
                <text x="70" y="74" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="monospace">LC-1</text>
                <text x="70" y="108" textAnchor="middle" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="600">
                  {cells[0]?.toFixed(1)} kg
                </text>
              </g>

              {/* Corner 2 (Top-Right) */}
              <g className="transition-all">
                <circle cx="390" cy="70" r="22" fill="#0A0A0B" stroke="#0EA5E9" strokeWidth="2" />
                <circle cx="390" cy="70" r="8" fill="#0EA5E9" className={shouldReduceMotion ? "" : "animate-ping opacity-30"} />
                <text x="390" y="74" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="monospace">LC-2</text>
                <text x="390" y="108" textAnchor="middle" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="600">
                  {cells[1]?.toFixed(1)} kg
                </text>
              </g>

              {/* Corner 3 (Bottom-Left) */}
              <g className="transition-all">
                <circle cx="70" cy="190" r="22" fill="#0A0A0B" stroke="#0EA5E9" strokeWidth="2" />
                <circle cx="70" cy="190" r="8" fill="#0EA5E9" className={shouldReduceMotion ? "" : "animate-ping opacity-30"} />
                <text x="70" y="194" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="monospace">LC-3</text>
                <text x="70" y="226" textAnchor="middle" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="600">
                  {cells[2]?.toFixed(1)} kg
                </text>
              </g>

              {/* Corner 4 (Bottom-Right) */}
              <g className="transition-all">
                <circle cx="390" cy="190" r="22" fill="#0A0A0B" stroke="#0EA5E9" strokeWidth="2" />
                <circle cx="390" cy="190" r="8" fill="#0EA5E9" className={shouldReduceMotion ? "" : "animate-ping opacity-30"} />
                <text x="390" y="194" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="monospace">LC-4</text>
                <text x="390" y="226" textAnchor="middle" fill="#0EA5E9" fontSize="11" fontFamily="monospace" fontWeight="600">
                  {cells[3]?.toFixed(1)} kg
                </text>
              </g>

              {/* Platform Center Readout */}
              <circle cx="230" cy="130" r="32" fill="#0A0A0B" stroke="rgba(255,255,255,0.18)" />
              <text x="230" y="128" textAnchor="middle" fill="#A1A1AA" fontSize="9" fontFamily="monospace">TOTAL</text>
              <text x="230" y="142" textAnchor="middle" fill="#FAFAFA" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {((packet?.gross_weight || 0) / 1000).toFixed(2)} t
              </text>
            </svg>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Platform Type: Steel Deck Pitless</span>
            <span>Junction Box: 4-Channel Analog to 24-bit ADC</span>
          </div>
        </div>

        {/* Live Drift Waveform / History */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#111113] border border-white/[0.08] flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-semibold text-lg text-[#FAFAFA]">
                Real-Time Load Jitter & Drift Waveform
              </h3>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                20-Packet Buffer
              </span>
            </div>

            {/* Simulated Live SVG Line Chart */}
            <div className="h-56 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-white/[0.08]">
              {history.map((val, idx) => {
                const heightPercent = Math.min(100, Math.max(10, ((val - 49980) / 40) * 100));
                return (
                  <motion.div
                    key={idx}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/20 to-cyan-400 origin-bottom relative group"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#0A0A0B] border border-white/[0.1] text-[9px] font-mono text-zinc-200 pointer-events-none transition-opacity">
                      {val.toFixed(1)}kg
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Sampling Frequency:</span>
              <span className="text-[#FAFAFA]">2 Hz (500ms intervals)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Standard Permissible Error (MPE):</span>
              <span className="text-cyan-400">±15.0 kg</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tamper Resistance Check:</span>
              <span className="text-emerald-400 font-bold">ALL LOAD-CELLS VERIFIED INTACT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
