import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Plus, CheckCircle2, Clock, AlertTriangle, FileText,
  CreditCard, MessageSquare, Download, ArrowRight, Shield,
  Building2, MapPin, Scale, RefreshCw, Send
} from "lucide-react";

export const ApplicantDashboard: React.FC<{ onNavigateToInspect?: (appId: number) => void }> = () => {
  const { t } = useLanguage();
  const [instruments, setInstruments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewInstModal, setShowNewInstModal] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  
  // New Instrument Form State
  const [instForm, setInstForm] = useState({
    instrument_type: "NON_AUTOMATIC_WEIGHING_INSTRUMENT",
    manufacturer: "DemoScale India",
    model: "DS-150P",
    serial_number: `DS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    model_approval_number: "IND/09/2024/412",
    accuracy_class: "CLASS_III",
    max_capacity: 150.0,
    min_capacity: 1.0,
    verification_scale_interval_e: 0.05,
    actual_scale_interval_d: 0.01,
    unit: "kg",
    installation_location: "Shop #12, Market Yard",
    owner_name: "Rajesh Sharma",
    business_name: "Sharma Agro Commodities",
    address: "Market Yard, Gultekdi, Pune",
    district: "Pune",
    division: "Pune"
  });

  // New Application Form State
  const [appForm, setAppForm] = useState({
    instrument_id: 0,
    application_type: "NEW_VERIFICATION",
    is_premises_verification: true,
    advance_notice_days: 30,
    notes: "Requesting statutory verification at premises."
  });

  // Active Query Response State
  const [respondingQuery, setRespondingQuery] = useState<{ appId: number, queryId: string } | null>(null);
  const [responseText, setResponseText] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [insts, apps, st] = await Promise.all([
        api.getInstruments(),
        api.getApplications(),
        api.getStats()
      ]);
      setInstruments(insts);
      setApplications(apps);
      setStats(st);
      if (insts.length > 0 && appForm.instrument_id === 0) {
        setAppForm(prev => ({ ...prev, instrument_id: insts[0].id }));
      }
    } catch (err) {
      console.error("Error fetching applicant data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInstrument(instForm);
      setShowNewInstModal(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createApplication(appForm);
      setShowNewAppModal(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRespondQuery = async () => {
    if (!respondingQuery || !responseText.trim()) return;
    try {
      await api.respondQuery(respondingQuery.appId, respondingQuery.queryId, responseText);
      setRespondingQuery(null);
      setResponseText("");
      fetchData();
    } catch (err: any) {
      alert("Error responding to query: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Registered Instruments</span>
            <Scale className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.total_instruments || instruments.length}</div>
          <div className="mt-1 text-[11px] text-emerald-400">Class I, II, III, IIII Active</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Applications</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{(stats?.pending_review || 0) + (stats?.scheduled || 0) + (stats?.under_inspection || 0)}</div>
          <div className="mt-1 text-[11px] text-slate-400">Under Scrutiny & Scheduled</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Verified (Passed)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.passed || 0}</div>
          <div className="mt-1 text-[11px] text-emerald-400">Schedule IX Records Issued</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Renewals Due (90 Days)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.expiring_soon || 0}</div>
          <div className="mt-1 text-[11px] text-rose-400">Advance Notice Window</div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">Commercial Instruments & Verification Workflow</h2>
          <p className="text-xs text-slate-400">Submit new applications, track scrutiny status, upload challans, and download certificates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewInstModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Instrument</span>
          </button>
          <button
            onClick={() => setShowNewAppModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Apply for Verification</span>
          </button>
        </div>
      </div>

      {/* Applications Workflow List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Application Tracking & Workflow Timeline</h3>
        
        {applications.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
            No verification applications found. Click "Apply for Verification" above to submit one.
          </div>
        ) : (
          applications.map((app) => {
            const inst = app.instrument;
            const isPassed = ["INSPECTION_PASSED", "CERTIFICATE_ISSUED", "ACTIVE"].includes(app.status);
            const isFailed = ["INSPECTION_FAILED", "REJECTED"].includes(app.status);
            const hasQuery = app.queries && app.queries.some((q: any) => q.status === "OPEN");

            return (
              <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                {/* App Top Line */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-400">{app.application_id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {app.application_type}
                      </span>
                      {app.is_premises_verification && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                          PREMISES (30-DAY NOTICE)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Submitted on {new Date(app.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      isPassed ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800" :
                      isFailed ? "bg-rose-950/80 text-rose-400 border border-rose-800" :
                      hasQuery ? "bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse" :
                      "bg-blue-950/80 text-blue-300 border border-blue-800"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Instrument Info Summary */}
                {inst && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500 block">Instrument</span>
                      <span className="font-medium text-slate-200">{inst.manufacturer} {inst.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Serial Number</span>
                      <span className="font-mono text-slate-200">{inst.serial_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Class & Capacity</span>
                      <span className="font-medium text-slate-200">{inst.accuracy_class} | {inst.max_capacity} {inst.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Scale Intervals</span>
                      <span className="font-mono text-slate-200">e={inst.verification_scale_interval_e} / d={inst.actual_scale_interval_d} {inst.unit}</span>
                    </div>
                  </div>
                )}

                {/* Workflow Progress Stepper */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">Statutory Scrutiny & Verification Pipeline</span>
                    <span>Jurisdiction: <b className="text-slate-200">{app.jurisdiction_status}</b></span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`p-2 rounded text-center text-xs font-medium border ${
                      ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "SCHEDULED", "UNDER_INSPECTION", "INSPECTION_PASSED", "CERTIFICATE_ISSUED"].includes(app.status)
                        ? "bg-blue-950/40 border-blue-700 text-blue-300"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      1. Scrutiny
                    </div>
                    <div className={`p-2 rounded text-center text-xs font-medium border ${
                      ["APPROVED", "SCHEDULED", "UNDER_INSPECTION", "INSPECTION_PASSED", "CERTIFICATE_ISSUED"].includes(app.status)
                        ? "bg-blue-950/40 border-blue-700 text-blue-300"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      2. Scheduled
                    </div>
                    <div className={`p-2 rounded text-center text-xs font-medium border ${
                      ["UNDER_INSPECTION", "INSPECTION_PASSED", "CERTIFICATE_ISSUED"].includes(app.status)
                        ? "bg-blue-950/40 border-blue-700 text-blue-300"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      3. Field Tests
                    </div>
                    <div className={`p-2 rounded text-center text-xs font-medium border ${
                      ["INSPECTION_PASSED", "CERTIFICATE_ISSUED"].includes(app.status)
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-300"
                        : isFailed
                        ? "bg-rose-950/40 border-rose-700 text-rose-300"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      4. Decision & Cert
                    </div>
                  </div>
                </div>

                {/* Deficiency Queries Alert (if any) */}
                {hasQuery && (
                  <div className="bg-amber-950/30 border border-amber-800/80 p-3 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Action Required: Scrutiny Query Raised</span>
                    </div>
                    {app.queries.filter((q: any) => q.status === "OPEN").map((q: any) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-slate-300 bg-slate-900/90 p-2.5 rounded border border-slate-800">
                          <b className="text-amber-300">{q.raised_by}:</b> {q.query_text}
                        </p>
                        {respondingQuery?.queryId === q.query_id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Type response to deficiency query..."
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              onClick={handleRespondQuery}
                              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Submit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRespondingQuery({ appId: app.id, queryId: q.query_id })}
                            className="px-2.5 py-1 rounded bg-amber-600/20 text-amber-300 border border-amber-600/40 text-xs font-medium hover:bg-amber-600/30"
                          >
                            Reply to Query
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inspection Date / Appointment info if scheduled */}
                {app.scheduled_date && (
                  <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Scheduled Visit: <b>{app.scheduled_date} at {app.scheduled_time || "10:00 AM"}</b></span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{app.test_centre_or_premises}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Register Instrument */}
      {showNewInstModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Non-Automatic Weighing Instrument</h3>
              <button onClick={() => setShowNewInstModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateInstrument} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={instForm.manufacturer}
                    onChange={(e) => setInstForm({ ...instForm, manufacturer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model Name / Number</label>
                  <input
                    type="text"
                    required
                    value={instForm.model}
                    onChange={(e) => setInstForm({ ...instForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Serial Number (Unique)</label>
                  <input
                    type="text"
                    required
                    value={instForm.serial_number}
                    onChange={(e) => setInstForm({ ...instForm, serial_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model Approval Certificate #</label>
                  <input
                    type="text"
                    value={instForm.model_approval_number}
                    onChange={(e) => setInstForm({ ...instForm, model_approval_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Accuracy Class</label>
                  <select
                    value={instForm.accuracy_class}
                    onChange={(e) => setInstForm({ ...instForm, accuracy_class: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="CLASS_I">Class I (Special)</option>
                    <option value="CLASS_II">Class II (High)</option>
                    <option value="CLASS_III">Class III (Medium)</option>
                    <option value="CLASS_IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Max Capacity (kg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={instForm.max_capacity}
                    onChange={(e) => setInstForm({ ...instForm, max_capacity: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min Capacity (kg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={instForm.min_capacity}
                    onChange={(e) => setInstForm({ ...instForm, min_capacity: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Verification Scale Interval e (kg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={instForm.verification_scale_interval_e}
                    onChange={(e) => setInstForm({ ...instForm, verification_scale_interval_e: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Actual Scale Interval d (kg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={instForm.actual_scale_interval_d}
                    onChange={(e) => setInstForm({ ...instForm, actual_scale_interval_d: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Maharashtra District</label>
                  <select
                    value={instForm.district}
                    onChange={(e) => setInstForm({ ...instForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Mumbai City">Mumbai City</option>
                    <option value="Mumbai Suburban">Mumbai Suburban</option>
                    <option value="Thane">Thane</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Division</label>
                  <input
                    type="text"
                    value={instForm.division}
                    onChange={(e) => setInstForm({ ...instForm, division: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Trader / Business Name</label>
                <input
                  type="text"
                  required
                  value={instForm.business_name}
                  onChange={(e) => setInstForm({ ...instForm, business_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewInstModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Save Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Verification Application */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Apply for Legal Metrology Verification</h3>
              <button onClick={() => setShowNewAppModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Registered Instrument</label>
                <select
                  value={appForm.instrument_id}
                  onChange={(e) => setAppForm({ ...appForm, instrument_id: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                >
                  {instruments.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.instrument_id} — {i.manufacturer} {i.model} ({i.max_capacity} {i.unit}, {i.accuracy_class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Application Type</label>
                  <select
                    value={appForm.application_type}
                    onChange={(e) => setAppForm({ ...appForm, application_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="NEW_VERIFICATION">New Verification</option>
                    <option value="RE_VERIFICATION">Re-Verification</option>
                    <option value="PREMISES_VERIFICATION">Premises Verification</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Advance Notice (Days)</label>
                  <input
                    type="number"
                    value={appForm.advance_notice_days}
                    onChange={(e) => setAppForm({ ...appForm, advance_notice_days: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-blue-950/30 p-3 rounded border border-blue-800">
                <input
                  type="checkbox"
                  id="premises_chk"
                  checked={appForm.is_premises_verification}
                  onChange={(e) => setAppForm({ ...appForm, is_premises_verification: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="premises_chk" className="text-slate-300 text-xs">
                  Request verification at user/trader premises (Statutory 30-day advance application under Maharashtra procedure)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
