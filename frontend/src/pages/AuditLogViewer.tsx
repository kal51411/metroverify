import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { FileCheck, ShieldCheck, RefreshCw } from "lucide-react";

export const AuditLogViewer: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const evs = await api.getAuditEvents();
      setEvents(evs);
      const chainStatus = await api.verifyAuditChain();
      setVerifyStatus(chainStatus);
    } catch (err) {
      console.error("Error loading audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Cryptographic Immutable Audit Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Append-only audit trail with SHA-256 hash chaining (previous_hash to event_hash).
          </p>
        </div>

        <button
          onClick={loadAuditData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Verify Hash Chain</span>
        </button>
      </div>

      {verifyStatus && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          verifyStatus.is_valid
            ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
            : "bg-rose-950/30 border-rose-800 text-rose-300"
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span><b>Cryptographic Chain Verification:</b> {verifyStatus.message}</span>
          </div>
          <span className="font-mono text-xs font-bold">
            Total Blocks: {verifyStatus.total_events}
          </span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Append-Only Event Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp & ID</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type / ID</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Previous Hash &rarr; Block Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="text-slate-300 font-sans">{new Date(ev.timestamp).toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-blue-400 font-bold">{ev.event_id}</div>
                  </td>
                  <td className="p-3 font-sans">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold text-[10px]">
                      {ev.action}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-200">
                    {ev.entity_type} <span className="font-mono text-slate-400">#{ev.entity_id}</span>
                  </td>
                  <td className="p-3 font-sans text-slate-400">
                    User {ev.user_id} ({ev.user_role})
                  </td>
                  <td className="p-3 text-[10px] text-slate-400">
                    <div className="truncate max-w-[240px] text-slate-500">Prev: {ev.previous_event_hash || "GENESIS"}</div>
                    <div className="truncate max-w-[240px] text-emerald-400 font-bold">Hash: {ev.event_hash}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
