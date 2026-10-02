import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import {
  ShieldCheck, CheckCircle2, Clock, PlayCircle, AlertCircle,
  FileCheck2, XCircle, Search, Calendar, MapPin, Scale
} from "lucide-react";

interface InspectorDashboardProps {
  onSelectInspection: (appId: number) => void;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ onSelectInspection }) => {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [queryModalAppId, setQueryModalAppId] = useState<number | null>(null);
  const [queryText, setQueryText] = useState("");
  const [scheduleModalApp, setScheduleModalApp] = useState<any | null>(null);
  const [schedDate, setSchedDate] = useState("2026-10-05");
  const [schedTime, setSchedTime] = useState("10:30 AM");

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await api.getApplications();
      setApplications(apps);
    } catch (err) {
      console.error("Error loading inspector dashboard apps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (appId: number) => {
    try {
      await api.approveApplication(appId);
      loadData();
    } catch (err: any) {
      alert("Error approving application: " + err.message);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalApp) return;
    try {
      await api.scheduleApplication(scheduleModalApp.id, {
        scheduled_date: schedDate,
        scheduled_time: schedTime,
        test_centre_or_premises: scheduleModalApp.instrument?.address || "Trader Premises",
        inspector_id: 2
      });
      setScheduleModalApp(null);
      loadData();
    } catch (err: any) {
      alert("Error scheduling inspection: " + err.message);
    }
  };

  const handleRaiseQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryModalAppId || !queryText.trim()) return;
    try {
      await api.raiseQuery(queryModalAppId, queryText);
      setQueryModalAppId(null);
      setQueryText("");
      loadData();
    } catch (err: any) {
      alert("Error raising query: " + err.message);
    }
  };

  const filteredApps = applications.filter(a => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "PENDING_SCRUTINY") return ["SUBMITTED", "UNDER_REVIEW", "QUERY_RESPONDED"].includes(a.status);
    if (selectedFilter === "SCHEDULED") return a.status === "SCHEDULED";
    if (selectedFilter === "UNDER_INSPECTION") return a.status === "UNDER_INSPECTION";
    if (selectedFilter === "COMPLETED") return ["INSPECTION_PASSED", "CERTIFICATE_ISSUED", "INSPECTION_FAILED"].includes(a.status);
    return a.status === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Inspector Top Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Inspector Verification & Enforcement Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Territory: <b>Pune District Enforcement Division</b> | Inspector: <b>Vikram Patil (ID #MH-INSP-042)</b>
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { id: "ALL", label: "All Records" },
            { id: "PENDING_SCRUTINY", label: "Pending Scrutiny" },
            { id: "SCHEDULED", label: "Scheduled Visits" },
            { id: "UNDER_INSPECTION", label: "In Progress" },
            { id: "COMPLETED", label: "Completed" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                selectedFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Queue */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
            No applications found matching filter "{selectedFilter}".
          </div>
        ) : (
          filteredApps.map((app) => {
            const inst = app.instrument;
            const canStart = ["SCHEDULED", "APPROVED", "UNDER_INSPECTION"].includes(app.status);
            const isCompleted = ["INSPECTION_PASSED", "CERTIFICATE_ISSUED", "INSPECTION_FAILED"].includes(app.status);

            return (
              <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{app.application_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {app.application_type}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                      app.status === "SCHEDULED" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                      app.status === "UNDER_INSPECTION" ? "bg-blue-950 text-blue-300 border border-blue-800 animate-pulse" :
                      isCompleted ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                      "bg-slate-800 text-slate-300"
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {inst && (
                    <div className="text-xs text-slate-300">
                      <b>{inst.business_name}</b> ({inst.owner_name}) — {inst.manufacturer} {inst.model} [SN: <span className="font-mono">{inst.serial_number}</span>]
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {inst?.address}, {inst?.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3 text-slate-500" />
                      Class: <b>{inst?.accuracy_class}</b> | Max: <b>{inst?.max_capacity} {inst?.unit}</b> (e={inst?.verification_scale_interval_e} {inst?.unit})
                    </span>
                  </div>
                </div>

                {/* Inspector Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {app.status === "SUBMITTED" && (
                    <>
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Approve Scrutiny
                      </button>
                      <button
                        onClick={() => setQueryModalAppId(app.id)}
                        className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 text-xs font-medium"
                      >
                        Raise Query
                      </button>
                    </>
                  )}

                  {app.status === "APPROVED" && (
                    <button
                      onClick={() => setScheduleModalApp(app)}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Schedule Visit
                    </button>
                  )}

                  {canStart && (
                    <button
                      onClick={() => onSelectInspection(app.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{app.status === "UNDER_INSPECTION" ? "Resume Inspection" : "Launch Inspection Engine"}</span>
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      onClick={() => onSelectInspection(app.id)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium"
                    >
                      View Record & Certificate
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Schedule Verification Visit</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Inspection Time</label>
                <input
                  type="text"
                  required
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 text-white font-semibold"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Modal */}
      {queryModalAppId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Raise Scrutiny Deficiency Query</h3>
            <form onSubmit={handleRaiseQuerySubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Query / Deficiency Explanation</label>
                <textarea
                  rows={3}
                  required
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="e.g., Purchase bill missing manufacturer seal or model approval certificate illegible."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQueryModalAppId(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-600 text-white font-semibold"
                >
                  Send Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
