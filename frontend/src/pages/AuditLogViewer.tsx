import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { ChevronDown, ChevronRight, Shield, CheckCircle, XCircle } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CERTIFICATE_ISSUED:    "text-pass",
  INSPECTION_COMPLETED:  "text-amber",
  INSPECTION_STARTED:    "text-fog",
  MEASUREMENT_RECORDED:  "text-silver",
  APPLICATION_SUBMITTED: "text-fog",
  APPLICATION_APPROVED:  "text-amber-light",
  CERTIFICATE_REVOKED:   "text-fail",
};

export const AuditLogViewer: React.FC = () => {
  const [events, setEvents]       = useState<any[]>([]);
  const [chain, setChain]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getAuditEvents(), api.verifyAuditChain()])
      .then(([evts, c]) => { setEvents(evts); setChain(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Shield className="w-6 h-6 text-amber animate-pulse" />
      <span className="font-mono text-sm text-ash">Verifying hash chain…</span>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-iron pb-6">
        <h2 className="font-display font-bold text-4xl text-warm tracking-tight">Audit Trail</h2>
        <p className="text-silver text-sm mt-1.5">SHA-256 hash-chained append-only event ledger.</p>
      </div>

      {/* Chain integrity */}
      {chain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between px-6 py-5 border ${
            chain.is_valid
              ? "border-pass/30 bg-passBg"
              : "border-fail/30 bg-failBg"
          }`}
        >
          <div className="flex items-center gap-3">
            {chain.is_valid
              ? <CheckCircle className="w-6 h-6 text-pass" />
              : <XCircle className="w-6 h-6 text-fail" />
            }
            <div>
              <div className={`font-mono text-xs font-bold uppercase tracking-widest ${chain.is_valid ? "text-pass" : "text-fail"}`}>
                {chain.is_valid ? "Hash Chain Integrity Verified" : "Hash Chain Integrity Compromised"}
              </div>
              <div className="font-mono text-[11px] text-ash mt-0.5">{chain.message}</div>
            </div>
          </div>
          <div className="font-display font-extrabold text-5xl text-iron">{chain.total_events}</div>
        </motion.div>
      )}

      {/* Events */}
      {events.length === 0 ? (
        <div className="border border-iron py-20 text-center bg-charcoal">
          <div className="font-display text-2xl font-bold text-steel mb-2">No Events</div>
          <p className="font-mono text-xs text-ash">Audit events are written when actions occur in the system.</p>
        </div>
      ) : (
        <div className="border border-iron">
          {/* Header row */}
          <div className="grid grid-cols-12 border-b border-iron px-4 py-2.5 bg-onyx">
            {[
              { label: "Timestamp", span: "col-span-2" },
              { label: "Action", span: "col-span-3" },
              { label: "Actor", span: "col-span-2" },
              { label: "Entity", span: "col-span-3" },
              { label: "Hash", span: "col-span-2" },
            ].map(({ label, span }) => (
              <div key={label} className={`${span} font-mono text-[9px] text-ash uppercase tracking-widest`}>{label}</div>
            ))}
          </div>

          {events.map((evt, idx) => {
            const isExp = expanded === evt.event_id;
            const color = ACTION_COLORS[evt.action] || "text-ash";
            const ts = new Date(evt.timestamp);
            return (
              <div key={evt.event_id} className="border-b border-iron last:border-0">
                <button
                  onClick={() => setExpanded(isExp ? null : evt.event_id)}
                  className="w-full grid grid-cols-12 px-4 py-3.5 hover:bg-charcoal transition-colors items-center text-left"
                >
                  <div className="col-span-2 space-y-0.5">
                    <div className="font-mono text-xs font-bold text-warm">{ts.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                    <div className="font-mono text-[9px] text-steel">{ts.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                  </div>
                  <div className="col-span-3">
                    <span className={`font-mono text-[11px] font-bold ${color}`}>{evt.action}</span>
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <div className="font-mono text-[11px] text-fog">{evt.user_id || "SYSTEM"}</div>
                    <div className="font-mono text-[9px] text-steel">{evt.user_role}</div>
                  </div>
                  <div className="col-span-3 space-y-0.5">
                    <div className="font-mono text-[11px] text-fog">{evt.entity_type}</div>
                    <div className="font-mono text-[9px] text-steel truncate">{evt.entity_id}</div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-steel">{evt.chain_hash?.slice(0, 8)}…</span>
                    {isExp ? <ChevronDown className="w-3.5 h-3.5 text-ash" /> : <ChevronRight className="w-3.5 h-3.5 text-steel" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" as const }}
                      className="overflow-hidden"
                    >
                      <div className="bg-black border-t border-iron px-6 py-5 grid grid-cols-2 gap-4">
                        {[
                          { label: "Event ID", value: evt.event_id, wide: false },
                          { label: "IP Address", value: evt.ip_address || "—", wide: false },
                          { label: "Chain Hash (full)", value: evt.chain_hash, wide: true },
                          { label: "Previous Hash", value: evt.previous_hash || "[GENESIS BLOCK]", wide: true },
                        ].map(({ label, value, wide }) => (
                          <div key={label} className={wide ? "col-span-2" : ""}>
                            <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-1">{label}</div>
                            <div className="font-mono text-[11px] text-silver break-all">{value}</div>
                          </div>
                        ))}
                        {evt.new_value_json && (
                          <div className="col-span-2">
                            <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-1">Payload</div>
                            <pre className="font-mono text-[10px] text-ash bg-charcoal border border-iron p-4 overflow-x-auto leading-relaxed">
                              {JSON.stringify(JSON.parse(evt.new_value_json || "{}"), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
