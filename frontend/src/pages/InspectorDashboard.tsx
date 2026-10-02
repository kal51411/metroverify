import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import {
  ShieldCheck, CheckCircle2, Clock, XCircle,
  FileCheck2, Search, MapPin, Scale, ChevronRight, AlertTriangle
} from "lucide-react";

interface InspectorDashboardProps {
  onSelectInspection: (appId: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "SUBMITTED", color: "text-blue-400" },
  UNDER_SCRUTINY: { label: "SCRUTINY", color: "text-blue-300" },
  SCHEDULED: { label: "SCHEDULED", color: "text-amber-400" },
  IN_PROGRESS: { label: "IN PROGRESS", color: "text-amber-300" },
  INSPECTION_PASSED: { label: "PASSED", color: "text-emerald-400" },
  INSPECTION_FAILED: { label: "FAILED", color: "text-rose-400" },
  CERTIFICATE_ISSUED: { label: "CERTIFIED", color: "text-emerald-500" },
  REJECTED: { label: "REJECTED", color: "text-rose-500" },
  PENDING_QUERY: { label: "QUERY", color: "text-amber-400" },
};

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ onSelectInspection }) => {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [rejectModal, setRejectModal] = useState<{ id: number; reason: string } | null>(null);
  const [scheduleModal, setScheduleModal] = useState<any | null>(null);
  const [schedDate, setSchedDate] = useState("2026-10-05");
  const [schedTime, setSchedTime] = useState("10:30 AM");

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await api.getApplications();
      setApplications(apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (appId: number) => {
    try {
      await api.approveApplication(appId);
      await loadData();
    } catch (err: any) {
      alert("Error approving application: " + err.message);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal || !rejectModal.reason.trim()) return;
    try {
      await api.rejectApplication(rejectModal.id, rejectModal.reason);
      setRejectModal(null);
      await loadData();
    } catch (err: any) {
      alert("Error rejecting: " + err.message);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModal) return;
    try {
      await api.scheduleApplication(scheduleModal.id, {
        scheduled_date: schedDate,
        scheduled_time: schedTime,
        test_centre_or_premises: scheduleModal.instrument?.address || "Trader Premises",
        inspector_id: 2
      });
      setScheduleModal(null);
      await loadData();
    } catch (err: any) {
      alert("Error scheduling: " + err.message);
    }
  };

  const FILTER_TABS = [
    { id: "ALL", label: "ALL" },
    { id: "SUBMITTED", label: "SUBMITTED" },
    { id: "SCHEDULED", label: "SCHEDULED" },
    { id: "IN_PROGRESS", label: "IN PROGRESS" },
    { id: "INSPECTION_PASSED", label: "PASSED" },
    { id: "CERTIFICATE_ISSUED", label: "CERTIFIED" },
  ];

  const filteredApps = applications.filter(a =>
    selectedFilter === "ALL" ? true : a.status === selectedFilter
  );

  // Summary stats
  const counts = {
    total: applications.length,
    pending: applications.filter(a => ["SUBMITTED", "UNDER_SCRUTINY"].includes(a.status)).length,
    inProgress: applications.filter(a => a.status === "IN_PROGRESS").length,
    passed: applications.filter(a => a.status === "INSPECTION_PASSED").length,
    failed: applications.filter(a => a.status === "INSPECTION_FAILED").length,
    certified: applications.filter(a => a.status === "CERTIFICATE_ISSUED").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
        <Scale className="w-5 h-5 animate-pulse text-blue-500" />
        <span className="font-mono text-xs tracking-widest">LOADING INSPECTOR WORKSTATION…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-12">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-xs text-blue-400 font-bold tracking-widest uppercase">Inspector Workstation</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-white tracking-tight">Inspection Queue</h2>
        <p className="text-sm text-slate-400 mt-1">Legal Metrology Act, 2009 — Maharashtra Enforcement Framework</p>
      </div>

      {/* ── WORKLOAD DASHBOARD STATS ──────────────────────────────── */}
      <div className="border border-slate-800 bg-[#0a0f1d]">
        <div className="border-b border-slate-800 px-6 py-3">
          <span className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">WORKLOAD SUMMARY</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-800">
          {[
            { label: "TOTAL", value: counts.total, color: "text-white" },
            { label: "PENDING", value: counts.pending, color: "text-blue-400" },
            { label: "IN PROGRESS", value: counts.inProgress, color: "text-amber-400" },
            { label: "PASSED", value: counts.passed, color: "text-emerald-400" },
            { label: "FAILED", value: counts.failed, color: "text-rose-400" },
            { label: "CERTIFIED", value: counts.certified, color: "text-emerald-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-5 text-center">
              <div className={`font-display font-extrabold text-4xl ${color}`}>{value < 10 ? `0${value}` : value}</div>
              <div className="font-mono text-[10px] text-slate-500 tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider border transition whitespace-nowrap ${
              selectedFilter === tab.id
                ? "bg-blue-950/60 border-blue-600/60 text-blue-300"
                : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-transparent"
            }`}
          >
            {tab.label}
            {tab.id !== "ALL" && (
              <span className="ml-2 text-[10px] opacity-60">
                {applications.filter(a => tab.id === "ALL" || a.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── INSPECTION QUEUE TABLE ────────────────────────────────── */}
      {filteredApps.length === 0 ? (
        <div className="border border-slate-800 bg-[#080c14] py-16 text-center">
          <div className="font-display text-xl font-bold text-slate-500 mb-2">NO ACTIVE INSPECTIONS</div>
          <p className="font-mono text-xs text-slate-600">Your assigned inspection queue is currently empty for this filter.</p>
        </div>
      ) : (
        <div className="border border-slate-800">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-slate-800 px-4 py-2 bg-[#05080e]">
            {["APPLICATION ID", "INSTRUMENT", "OWNER", "DISTRICT", "STATUS", "ACTIONS"].map((h, i) => (
              <div key={h} className={`font-mono text-[10px] text-slate-600 tracking-widest uppercase ${
                i === 0 ? "col-span-2" : i === 1 ? "col-span-2" : i === 2 ? "col-span-3" : i === 3 ? "col-span-2" : i === 4 ? "col-span-1" : "col-span-2"
              }`}>
                {h}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          {filteredApps.map(app => {
            const inst = app.instrument;
            const cfg = STATUS_CONFIG[app.status] || { label: app.status, color: "text-slate-400" };
            const canInspect = ["SCHEDULED", "APPROVED", "IN_PROGRESS"].includes(app.status);
            const canApprove = app.status === "SUBMITTED";
            const canSchedule = app.status === "SUBMITTED" || app.status === "UNDER_SCRUTINY";

            return (
              <div key={app.id} className="grid grid-cols-12 border-b border-slate-800 px-4 py-4 hover:bg-slate-900/30 transition items-center group">
                <div className="col-span-2">
                  <div className="font-mono text-xs font-bold text-blue-400">{app.application_id}</div>
                  <div className="font-mono text-[10px] text-slate-600 mt-0.5">{app.application_type?.replace(/_/g, " ")}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-xs text-slate-300">{inst?.instrument_type?.replace(/_/g, " ") || "—"}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">{inst?.model}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-xs text-slate-300 truncate">{inst?.owner_name || "—"}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">{inst?.business_name}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-600" />
                    {inst?.district || "—"}
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`font-mono text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {canInspect && (
                    <button
                      onClick={() => onSelectInspection(app.id)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-bold tracking-wider border border-blue-400/40 flex items-center gap-1 transition"
                    >
                      INSPECT <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[10px] border border-slate-700 transition"
                    >
                      APPROVE
                    </button>
                  )}
                  {canSchedule && (
                    <button
                      onClick={() => setScheduleModal(app)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-mono text-[10px] border border-slate-800 transition"
                    >
                      SCHEDULE
                    </button>
                  )}
                  {canApprove && (
                    <button
                      onClick={() => setRejectModal({ id: app.id, reason: "" })}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 text-rose-400 font-mono text-[10px] border border-slate-800 hover:border-rose-800 transition"
                    >
                      REJECT
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── REJECT MODAL ──────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-700 space-y-0">
            <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="font-mono text-xs font-bold text-rose-400 tracking-widest uppercase">Reject Application</span>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-sm text-slate-400">You must provide a specific reason for rejection. This will be recorded in the audit ledger.</p>
              <textarea
                required
                placeholder="Specific reason for rejection (e.g. Nameplate missing, Sealing provision defective)..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                rows={4}
                className="w-full bg-[#05080e] border border-slate-800 px-4 py-3 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-rose-600 resize-none"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-slate-700 text-slate-400 font-mono text-xs hover:bg-slate-900 transition">CANCEL</button>
                <button type="submit" className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-mono text-xs font-bold border border-rose-500/40 transition">CONFIRM REJECT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ────────────────────────────────────────── */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-700 space-y-0">
            <div className="border-b border-slate-800 px-6 py-4">
              <span className="font-mono text-xs font-bold text-amber-400 tracking-widest uppercase">Schedule Inspection</span>
              <div className="font-mono text-[11px] text-slate-500 mt-1">{scheduleModal.application_id}</div>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="font-mono text-[10px] text-slate-500 tracking-widest uppercase block mb-1">Date</label>
                <input type="date" required value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-[#05080e] border border-slate-800 px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-slate-500 tracking-widest uppercase block mb-1">Time</label>
                <input type="text" required value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                  placeholder="10:30 AM"
                  className="w-full bg-[#05080e] border border-slate-800 px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setScheduleModal(null)} className="flex-1 py-2.5 border border-slate-700 text-slate-400 font-mono text-xs hover:bg-slate-900 transition">CANCEL</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-mono text-xs font-bold border border-amber-500/40 transition">CONFIRM SCHEDULE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
