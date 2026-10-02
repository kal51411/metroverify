import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { RotateCcw, ChevronDown, ChevronRight, Shield, Clock } from "lucide-react";

const EVENT_COLORS: Record<string, string> = {
  CERTIFICATE_ISSUED: "text-emerald-400",
  INSPECTION_COMPLETED: "text-blue-400",
  INSPECTION_STARTED: "text-blue-300",
  MEASUREMENT_RECORDED: "text-slate-300",
  MPE_CALCULATED: "text-slate-300",
  APPLICATION_SUBMITTED: "text-amber-400",
  APPLICATION_APPROVED: "text-amber-300",
  CERTIFICATE_REVOKED: "text-rose-400",
};

export const AuditLogViewer: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [chainStatus, setChainStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getAuditEvents(), api.verifyAuditChain()])
      .then(([evts, chain]) => { setEvents(evts); setChainStatus(chain); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RotateCcw className="w-5 h-5 animate-spin text-blue-500" />
        <span className="font-mono text-xs text-slate-400 tracking-widest">LOADING AUDIT LEDGER…</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-xs text-blue-400 font-bold tracking-widest">CRYPTOGRAPHIC AUDIT LEDGER</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-white tracking-tight">System Audit Trail</h2>
        <p className="text-sm text-slate-400 mt-1">Append-only SHA-256 hash-chained event log. Any tampering invalidates the chain.</p>
      </div>

      {/* Chain Integrity Status */}
      {chainStatus && (
        <div className={`border px-6 py-4 flex items-center justify-between ${
          chainStatus.is_valid
            ? "border-emerald-800 bg-emerald-950/30"
            : "border-rose-800 bg-rose-950/30"
        }`}>
          <div>
            <div className={`font-mono text-xs font-bold tracking-widest ${chainStatus.is_valid ? "text-emerald-400" : "text-rose-400"}`}>
              {chainStatus.is_valid ? "✓ HASH CHAIN INTEGRITY: VERIFIED" : "✕ HASH CHAIN INTEGRITY: COMPROMISED"}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-1">{chainStatus.message}</div>
          </div>
          <div className="font-mono text-2xl font-extrabold text-slate-400">{chainStatus.total_events}</div>
        </div>
      )}

      {/* Events Log */}
      {events.length === 0 ? (
        <div className="border border-slate-800 py-16 text-center">
          <div className="font-display text-xl font-bold text-slate-500 mb-2">NO AUDIT EVENTS</div>
          <p className="font-mono text-xs text-slate-600">Audit events are recorded when applications, inspections, and certificates are created.</p>
        </div>
      ) : (
        <div className="border border-slate-800">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-slate-800 px-4 py-2 bg-[#05080e]">
            <div className="col-span-2 font-mono text-[10px] text-slate-600 tracking-widest">TIMESTAMP</div>
            <div className="col-span-3 font-mono text-[10px] text-slate-600 tracking-widest">EVENT</div>
            <div className="col-span-2 font-mono text-[10px] text-slate-600 tracking-widest">ACTOR</div>
            <div className="col-span-3 font-mono text-[10px] text-slate-600 tracking-widest">ENTITY</div>
            <div className="col-span-2 font-mono text-[10px] text-slate-600 tracking-widest">HASH (PREVIEW)</div>
          </div>

          {events.map((evt) => {
            const isExpanded = expandedId === evt.event_id;
            const color = EVENT_COLORS[evt.action] || "text-slate-400";
            const ts = new Date(evt.timestamp);
            const timeStr = ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            const dateStr = ts.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

            return (
              <div key={evt.event_id} className="border-b border-slate-800 last:border-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : evt.event_id)}
                  className="w-full grid grid-cols-12 px-4 py-3 hover:bg-slate-900/30 transition items-center text-left"
                >
                  <div className="col-span-2">
                    <div className="font-mono text-xs text-white font-bold">{timeStr}</div>
                    <div className="font-mono text-[10px] text-slate-600">{dateStr}</div>
                  </div>
                  <div className="col-span-3">
                    <span className={`font-mono text-xs font-bold ${color}`}>{evt.action}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="font-mono text-xs text-slate-400">{evt.user_id || "SYSTEM"}</div>
                    <div className="font-mono text-[10px] text-slate-600">{evt.user_role}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="font-mono text-xs text-slate-300">{evt.entity_type}</div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">{evt.entity_id}</div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-600">{evt.chain_hash?.slice(0, 10)}…</span>
                    {isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      : <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-[#05080e] border-t border-slate-800 px-6 py-4 grid grid-cols-2 gap-4">
                    {[
                      { label: "EVENT ID", value: evt.event_id },
                      { label: "IP ADDRESS", value: evt.ip_address || "—" },
                      { label: "CHAIN HASH (FULL)", value: evt.chain_hash, wide: true },
                      { label: "PREVIOUS HASH", value: evt.previous_hash || "[GENESIS]", wide: true },
                    ].map(({ label, value, wide }) => (
                      <div key={label} className={wide ? "col-span-2" : ""}>
                        <div className="font-mono text-[10px] text-slate-600 tracking-widest uppercase mb-1">{label}</div>
                        <div className="font-mono text-[11px] text-slate-300 break-all">{value}</div>
                      </div>
                    ))}
                    {evt.new_value_json && (
                      <div className="col-span-2">
                        <div className="font-mono text-[10px] text-slate-600 tracking-widest uppercase mb-1">PAYLOAD</div>
                        <pre className="font-mono text-[11px] text-slate-400 bg-[#080c14] border border-slate-800 p-3 overflow-x-auto">
                          {JSON.stringify(JSON.parse(evt.new_value_json || "{}"), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
