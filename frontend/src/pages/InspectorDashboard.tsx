import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import { ChevronRight, AlertTriangle, MapPin } from "lucide-react";

interface InspectorDashboardProps {
  onSelectInspection: (appId: number) => void;
}

const STATUS: Record<string, { label: string; color: string }> = {
  SUBMITTED:         { label: "Submitted",   color: "text-fog" },
  UNDER_SCRUTINY:    { label: "Scrutiny",    color: "text-fog" },
  SCHEDULED:         { label: "Scheduled",   color: "text-amber-light" },
  IN_PROGRESS:       { label: "In Progress", color: "text-amber" },
  INSPECTION_PASSED: { label: "Passed",      color: "text-pass" },
  INSPECTION_FAILED: { label: "Failed",      color: "text-fail" },
  CERTIFICATE_ISSUED:{ label: "Certified",   color: "text-pass" },
  REJECTED:          { label: "Rejected",    color: "text-fail" },
  PENDING_QUERY:     { label: "Query",       color: "text-amber" },
};

const FILTERS = ["ALL", "SUBMITTED", "SCHEDULED", "IN_PROGRESS", "INSPECTION_PASSED", "CERTIFICATE_ISSUED"];

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ onSelectInspection }) => {
  const { t } = useLanguage();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [rejectModal, setRejectModal] = useState<{ id: number; reason: string } | null>(null);
  const [schedModal, setSchedModal] = useState<any>(null);
  const [schedDate, setSchedDate] = useState("2026-10-05");
  const [schedTime, setSchedTime] = useState("10:30 AM");

  const loadData = async () => {
    try {
      setLoading(true);
      setApps(await api.getApplications());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = apps.filter(a => filter === "ALL" || a.status === filter);
  const counts = {
    total: apps.length,
    pending: apps.filter(a => ["SUBMITTED", "UNDER_SCRUTINY"].includes(a.status)).length,
    inProgress: apps.filter(a => a.status === "IN_PROGRESS").length,
    passed: apps.filter(a => a.status === "INSPECTION_PASSED").length,
    failed: apps.filter(a => a.status === "INSPECTION_FAILED").length,
    certified: apps.filter(a => a.status === "CERTIFICATE_ISSUED").length,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-iron pb-6">
        <h2 className="font-display font-bold text-4xl text-warm tracking-tight">Inspection Queue</h2>
        <p className="text-silver text-sm mt-1.5">Legal Metrology Act, 2009 — Maharashtra Enforcement</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 border border-iron divide-x divide-iron bg-charcoal">
        {[
          { label: "Total",      val: counts.total,      color: "text-fog" },
          { label: "Pending",    val: counts.pending,    color: "text-fog" },
          { label: "In Progress",val: counts.inProgress, color: "text-amber" },
          { label: "Passed",     val: counts.passed,     color: "text-pass" },
          { label: "Failed",     val: counts.failed,     color: "text-fail" },
          { label: "Certified",  val: counts.certified,  color: "text-pass" },
        ].map(({ label, val, color }) => (
          <div key={label} className="px-4 py-6 text-center">
            <div className={`font-display font-extrabold text-5xl ${color}`}>{val < 10 ? `0${val}` : val}</div>
            <div className="font-mono text-[10px] text-ash uppercase tracking-widest mt-2">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider border transition-colors ${
              filter === f
                ? "border-amber/60 bg-amber/10 text-amber"
                : "border-iron text-ash hover:text-fog hover:border-steel"
            }`}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center font-mono text-sm text-ash">Loading inspection queue…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-iron py-20 text-center bg-charcoal">
          <div className="font-display text-2xl font-bold text-steel mb-2">No Inspections</div>
          <p className="font-mono text-xs text-ash">Queue is empty for this filter.</p>
        </div>
      ) : (
        <div className="border border-iron">
          {/* Table header */}
          <div className="grid grid-cols-12 border-b border-iron px-4 py-2.5 bg-onyx">
            {[
              { label: "Application", span: "col-span-2" },
              { label: "Instrument", span: "col-span-2" },
              { label: "Owner", span: "col-span-3" },
              { label: "District", span: "col-span-2" },
              { label: "Status", span: "col-span-1" },
              { label: "Actions", span: "col-span-2" },
            ].map(({ label, span }) => (
              <div key={label} className={`${span} font-mono text-[9px] text-ash uppercase tracking-widest`}>{label}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((app, idx) => {
            const inst = app.instrument;
            const cfg = STATUS[app.status] || { label: app.status, color: "text-ash" };
            const canInspect = ["SCHEDULED", "APPROVED", "IN_PROGRESS"].includes(app.status);
            const canApprove = app.status === "SUBMITTED";

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-12 border-b border-iron px-4 py-4 hover:bg-charcoal transition-colors items-center"
              >
                <div className="col-span-2 space-y-0.5">
                  <div className="font-mono text-xs font-bold text-amber">{app.application_id}</div>
                  <div className="font-mono text-[9px] text-steel">{app.application_type?.replace(/_/g, " ")}</div>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <div className="font-mono text-xs text-fog">{inst?.instrument_type?.replace(/_/g, " ") || "—"}</div>
                  <div className="font-mono text-[9px] text-steel">{inst?.model}</div>
                </div>
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <div className="text-xs text-fog truncate">{inst?.owner_name || "—"}</div>
                  <div className="font-mono text-[9px] text-steel truncate">{inst?.business_name}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-xs text-ash flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-steel" />{inst?.district || "—"}
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`font-mono text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="col-span-2 flex flex-wrap gap-1.5">
                  {canInspect && (
                    <button
                      onClick={() => onSelectInspection(app.id)}
                      className="px-3 py-1.5 bg-amber hover:bg-amber-light text-black font-mono text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      INSPECT <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={async () => { await api.approveApplication(app.id); loadData(); }}
                      className="px-3 py-1.5 border border-iron text-pass font-mono text-[10px] hover:border-pass/40 hover:bg-pass/5 transition-colors"
                    >
                      APPROVE
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={() => setRejectModal({ id: app.id, reason: "" })}
                      className="px-3 py-1.5 border border-iron text-fail font-mono text-[10px] hover:border-fail/40 hover:bg-fail/5 transition-colors"
                    >
                      REJECT
                    </button>
                  )}
                  {["SUBMITTED", "UNDER_SCRUTINY"].includes(app.status) && (
                    <button
                      onClick={() => setSchedModal(app)}
                      className="px-3 py-1.5 border border-iron text-amber font-mono text-[10px] hover:border-amber/40 transition-colors"
                    >
                      SCHEDULE
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              className="w-full max-w-md bg-onyx border border-iron"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-iron px-6 py-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-fail" />
                <span className="font-mono text-xs font-bold text-fail uppercase tracking-wider">Reject Application</span>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!rejectModal.reason.trim()) return;
                await api.rejectApplication(rejectModal.id, rejectModal.reason);
                setRejectModal(null); loadData();
              }} className="p-6 space-y-4">
                <p className="text-sm text-silver">State the specific reason for rejection. This is recorded in the audit ledger.</p>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Nameplate missing, sealing provision defective..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal(p => p ? { ...p, reason: e.target.value } : null)}
                  className="w-full bg-black border border-iron px-4 py-3 text-sm text-warm font-mono placeholder:text-steel focus:outline-none focus:border-fail/60 resize-none transition-colors"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-iron text-ash font-mono text-xs hover:border-steel transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-fail hover:bg-fail/80 text-white font-mono text-xs font-bold transition-colors">Confirm Reject</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule modal */}
      <AnimatePresence>
        {schedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSchedModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              className="w-full max-w-md bg-onyx border border-iron"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-iron px-6 py-4">
                <span className="font-mono text-xs font-bold text-amber uppercase tracking-wider">Schedule Inspection</span>
                <div className="font-mono text-[10px] text-ash mt-0.5">{schedModal.application_id}</div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await api.scheduleApplication(schedModal.id, { scheduled_date: schedDate, scheduled_time: schedTime, test_centre_or_premises: schedModal.instrument?.address || "Trader Premises", inspector_id: 2 });
                setSchedModal(null); loadData();
              }} className="p-6 space-y-4">
                {[
                  { label: "Date", type: "date", value: schedDate, onChange: setSchedDate },
                  { label: "Time", type: "text", value: schedTime, onChange: setSchedTime, placeholder: "10:30 AM" },
                ].map(({ label, type, value, onChange, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="font-mono text-[10px] text-ash uppercase tracking-widest">{label}</label>
                    <input
                      type={type}
                      required
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-black border border-iron px-4 py-3 font-mono text-sm text-warm focus:outline-none focus:border-amber transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSchedModal(null)} className="flex-1 py-2.5 border border-iron text-ash font-mono text-xs hover:border-steel transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber hover:bg-amber-light text-black font-mono text-xs font-bold transition-colors">Confirm Schedule</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
