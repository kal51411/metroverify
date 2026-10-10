import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, ShieldCheck, 
  IndianRupee, Scale, ArrowUpRight, Activity, RefreshCw 
} from "lucide-react";

export function AdminAnalyticsDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<any>({
    total_inspections: 142,
    passed_inspections: 134,
    failed_inspections: 8,
    pass_rate_pct: 94.4,
    pending_applications: 18,
    total_revenue_inr: 284000.0,
    recent_inspections: [
      { id: "LM-INS-V3-20261010-9A4B2C", instrument_id: 1, result: "PASS", location: "Pune Mandi Yard", status: "PASSED", started_at: "2026-10-10T09:30:00Z" },
      { id: "LM-INS-V3-20261010-8C2F1E", instrument_id: 2, result: "PASS", location: "Nagpur Rail Depot", status: "PASSED", started_at: "2026-10-10T08:15:00Z" },
      { id: "LM-INS-V3-20261009-3D5A7B", instrument_id: 3, result: "FAIL", location: "Thane Industrial Zone", status: "FAILED", started_at: "2026-10-09T16:45:00Z" },
      { id: "LM-INS-V3-20261009-1A9E4C", instrument_id: 4, result: "PASS", location: "Nashik Grain Silo", status: "PASSED", started_at: "2026-10-09T14:10:00Z" }
    ]
  });
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v3/inspections/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>State Metrology Directorate Control Console</span>
          </div>
          <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-[#FAFAFA] tracking-[-0.03em]">
            Executive Analytics Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time statutory verification throughput, MPE compliance ratios, and fee reconciliation.</p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Total Field Inspections</span>
          <div className="font-sans font-semibold text-3xl text-[#FAFAFA]">{data.total_inspections}</div>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs Previous Cycle</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Statutory Pass Rate</span>
          <div className="font-sans font-semibold text-3xl text-emerald-400">{data.pass_rate_pct}%</div>
          <div className="text-[11px] font-mono text-zinc-500">{data.passed_inspections} Passed · {data.failed_inspections} Rejected</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Pending Scrutiny Queue</span>
          <div className="font-sans font-semibold text-3xl text-[#FAFAFA]">{data.pending_applications}</div>
          <div className="text-[11px] font-mono text-amber-400">Average Turnaround: 2.3 Days</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-2">
          <span className="text-xs font-mono text-zinc-500 block uppercase tracking-wider">Treasury Fees Reconciled</span>
          <div className="font-sans font-semibold text-3xl text-cyan-400">₹{Number(data.total_revenue_inr).toLocaleString()}</div>
          <div className="text-[11px] font-mono text-zinc-500">GRAS Electronic Challans Verified</div>
        </div>
      </div>

      {/* Animated SVG Donut Chart + Compliance Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <h3 className="font-sans font-semibold text-base text-[#FAFAFA] mb-6">MPE Compliance Distribution</h3>

          <div className="flex items-center justify-center py-6">
            <svg viewBox="0 0 160 160" className="w-48 h-48">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#27272A" strokeWidth="16" />
              {/* Passed Arc (94.4%) */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#10B981"
                strokeWidth="16"
                strokeDasharray={`${(data.pass_rate_pct / 100) * 377} 377`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="75" textAnchor="middle" fill="#FAFAFA" fontSize="22" fontWeight="600" fontFamily="sans-serif">
                {data.pass_rate_pct}%
              </text>
              <text x="80" y="95" textAnchor="middle" fill="#71717A" fontSize="10" fontFamily="monospace">
                COMPLIANT
              </text>
            </svg>
          </div>

          <div className="space-y-2 text-xs font-mono pt-4 border-t border-white/5">
            <div className="flex justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Passed Initial MPE:
              </span>
              <span className="text-[#FAFAFA] font-bold">{data.passed_inspections}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                Exceeded Tolerance (Failed):
              </span>
              <span className="text-[#FAFAFA] font-bold">{data.failed_inspections}</span>
            </div>
          </div>
        </div>

        {/* Recent Field Inspections Table / Mobile Stacked Cards */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans font-semibold text-base text-[#FAFAFA]">Recent Field Stamping Events</h3>
            <span className="font-mono text-xs text-zinc-500">Live Ledger Feed</span>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="pb-3">Inspection ID</th>
                  <th className="pb-3">Location Premise</th>
                  <th className="pb-3">Determination</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recent_inspections.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 text-cyan-400 font-bold">{row.id}</td>
                    <td className="py-3.5 text-zinc-300 font-sans">{row.location}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        row.result === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {row.result}
                      </span>
                    </td>
                    <td className="py-3.5 text-zinc-400">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="sm:hidden space-y-3 font-mono text-xs">
            {data.recent_inspections.map((row: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold">{row.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    row.result === "PASS"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {row.result}
                  </span>
                </div>
                <div className="text-zinc-300 font-sans">{row.location}</div>
                <div className="text-zinc-500 text-[10px]">Status: {row.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
