import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Shield, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  Plus, FileText, Download, Navigation, QrCode, ArrowUpRight,
  Send, Building, User, Activity, MapPin, Search, ChevronRight,
  Sliders, Check, Sparkles, AlertCircle, FileCheck
} from "lucide-react";
import { api } from "../api/client";

interface UnifiedCommandHubProps {
  onNavigateToInspect?: (appId: number) => void;
  onOpenGeoModal?: () => void;
}

export function UnifiedCommandHub({ onNavigateToInspect, onOpenGeoModal }: UnifiedCommandHubProps) {
  const [activeRole, setActiveRole] = useState<"TRADER" | "LMO" | "GATC" | "ADMIN">("TRADER");
  const [loading, setLoading] = useState(true);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [gatcCentres, setGatcCentres] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // 1-Click Renew State
  const [renewingAlertId, setRenewingAlertId] = useState<number | null>(null);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState<string | null>(null);

  // Field Verification MPE Calculator State
  const [testLoad, setTestLoad] = useState<number>(50.0);
  const [observedReading, setObservedReading] = useState<number>(50.02);
  const [scaleIntervalE, setScaleIntervalE] = useState<number>(0.05);
  const [accClass, setAccClass] = useState<string>("CLASS_III");

  // Allocate Modal State
  const [allocatingApp, setAllocatingApp] = useState<any | null>(null);
  const [allocTarget, setAllocTarget] = useState<"LMO" | "GATC">("LMO");
  const [allocGatcId, setAllocGatcId] = useState<number>(1);
  const [allocDate, setAllocDate] = useState<string>("2026-10-25");

  // New Application Modal State
  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<number>(0);
  const [appNotes, setAppNotes] = useState("Statutory premises verification requested.");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [insts, apps, certs, alts, gatcs, st] = await Promise.all([
        api.getInstruments().catch(() => []),
        api.getApplications().catch(() => []),
        api.getCertificates().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getGATCCentres().catch(() => []),
        api.getStats().catch(() => null)
      ]);
      setInstruments(insts);
      setApplications(apps);
      setCertificates(certs);
      setAlerts(alts);
      setGatcCentres(gatcs);
      setStats(st);
      if (insts.length > 0 && selectedInstId === 0) {
        setSelectedInstId(insts[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handle1ClickRenew = async (alertId: number) => {
    try {
      setRenewingAlertId(alertId);
      const res = await api.renewAlert(alertId, 1);
      setRenewSuccessMsg(res.message);
      await fetchData();
      setTimeout(() => setRenewSuccessMsg(null), 6000);
    } catch (err: any) {
      alert("Renewal Error: " + err.message);
    } finally {
      setRenewingAlertId(null);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingApp) return;
    try {
      await api.allocateApplication(allocatingApp.id, {
        allocation_target: allocTarget,
        gatc_id: allocTarget === "GATC" ? allocGatcId : undefined,
        inspector_id: allocTarget === "LMO" ? 2 : undefined,
        scheduled_date: allocDate,
        scheduled_time: "10:30 AM",
        priority: "HIGH",
        notes: `Statutory verification allocated to ${allocTarget} under 2026 enforcement rules.`
      });
      setAllocatingApp(null);
      fetchData();
    } catch (err: any) {
      alert("Allocation error: " + err.message);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createApplication({
        instrument_id: selectedInstId,
        application_type: "NEW_VERIFICATION",
        is_premises_verification: true,
        advance_notice_days: 30,
        notes: appNotes
      });
      setShowAppModal(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // MPE Calculation
  const errorVal = Number((observedReading - testLoad).toFixed(4));
  const verificationScaleCount = testLoad / (scaleIntervalE || 1);
  let allowedMpe = scaleIntervalE;
  if (verificationScaleCount <= 500) {
    allowedMpe = 0.5 * scaleIntervalE;
  } else if (verificationScaleCount <= 2000) {
    allowedMpe = 1.0 * scaleIntervalE;
  } else {
    allowedMpe = 1.5 * scaleIntervalE;
  }
  const isWithinMPE = Math.abs(errorVal) <= (allowedMpe + 0.0001);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-10">
      {/* Top Banner / Role Adaptive Pill Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Unified Legal Metrology Workflow Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#FAFAFA] tracking-tight">
            MetroVerify Command Hub
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            End-to-end statutory verification, GATC allocations, validity tracking, and digital QR stamping.
          </p>
        </div>

        {/* Cohesive Role Selector Switcher */}
        <div className="flex items-center bg-[#111113] p-1.5 rounded-full border border-white/10 self-start md:self-auto shadow-inner">
          {[
            { id: "TRADER", label: "Trader / Business" },
            { id: "LMO", label: "LMO Officer" },
            { id: "GATC", label: "GATC Centre" },
            { id: "ADMIN", label: "State Admin" },
          ].map((role) => {
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as any)}
                className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive ? "text-[#FAFAFA]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRolePill"
                    className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/40 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {renewSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{renewSuccessMsg}</span>
            </div>
            <button onClick={() => setRenewSuccessMsg(null)} className="text-xs text-emerald-400 underline">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl bg-[#111113] border border-white/5 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Registered Instruments</span>
          <div className="text-2xl sm:text-3xl font-semibold text-[#FAFAFA]">{instruments.length}</div>
          <span className="text-[11px] text-zinc-400 font-mono">Traceable in Pune Division</span>
        </div>
        <div className="p-5 rounded-3xl bg-[#111113] border border-white/5 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Active Digital QR Certs</span>
          <div className="text-2xl sm:text-3xl font-semibold text-cyan-400">{certificates.length}</div>
          <span className="text-[11px] text-zinc-400 font-mono">Form VI Cryptographic Certificates</span>
        </div>
        <div className="p-5 rounded-3xl bg-[#111113] border border-white/5 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Validity Expiry Alerts</span>
          <div className="text-2xl sm:text-3xl font-semibold text-amber-400">{alerts.length}</div>
          <span className="text-[11px] text-zinc-400 font-mono">Automated Rule 27 Scanner</span>
        </div>
        <div className="p-5 rounded-3xl bg-[#111113] border border-white/5 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Notified GATCs</span>
          <div className="text-2xl sm:text-3xl font-semibold text-emerald-400">{gatcCentres.length}</div>
          <span className="text-[11px] text-zinc-400 font-mono">Section 14 NABL / RRSL Accreditations</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TRADER / BUSINESS VIEW                                */}
      {/* ======================================================== */}
      {activeRole === "TRADER" && (
        <div className="space-y-10">
          {/* Smart Validity Radar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Statutory Validity Radar & 1-Click Renewal</span>
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Automated surveillance monitoring verification validity windows under Legal Metrology Rule 27.
                </p>
              </div>
              <button
                onClick={() => setShowAppModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>New Verification Application</span>
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-zinc-400 text-xs font-mono">
                All commercial instruments are compliant. No imminent validity expirations.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alt) => {
                  const isExp = alt.days_remaining < 0;
                  const isCritical = alt.days_remaining <= 15 && alt.days_remaining >= 0;
                  return (
                    <div
                      key={alt.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isExp
                          ? "bg-red-500/5 border-red-500/30"
                          : isCritical
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-cyan-500/5 border-cyan-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              isExp ? "bg-red-500/20 text-red-400" : isCritical ? "bg-amber-500/20 text-amber-300" : "bg-cyan-500/20 text-cyan-300"
                            }`}>
                              {isExp ? "EXPIRED" : `${alt.days_remaining} Days Remaining`}
                            </span>
                            <span className="text-zinc-500 text-xs font-mono">{alt.alert_id}</span>
                          </div>
                          <div className="text-sm font-medium text-[#FAFAFA]">
                            {alt.instrument ? `${alt.instrument.manufacturer} ${alt.instrument.model}` : "Commercial Weighing Scale"}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">
                            Serial: {alt.instrument?.serial_number || "N/A"} · Capacity: {alt.instrument?.max_capacity || 0} kg
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-2 pt-1">{alt.message}</p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {alt.status === "RENEWAL_SUBMITTED" ? "✓ Renewal In Progress" : "Action Required"}
                        </span>
                        {alt.status === "RENEWAL_SUBMITTED" ? (
                          <span className="text-xs text-emerald-400 font-mono">Application #{alt.renewal_application_id}</span>
                        ) : (
                          <button
                            onClick={() => handle1ClickRenew(alt.id)}
                            disabled={renewingAlertId === alt.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{renewingAlertId === alt.id ? "Submitting..." : "1-Click Renew"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instruments & Issued Certificates Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Instruments Registry */}
            <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-4">
              <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span>Commercial Scale Registry</span>
              </h3>
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-2">
                {instruments.map((inst) => (
                  <div key={inst.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-[#FAFAFA]">{inst.manufacturer} {inst.model}</div>
                      <div className="text-xs text-zinc-400 font-mono">
                        SN: {inst.serial_number} · {inst.accuracy_class} · {inst.max_capacity} {inst.unit}
                      </div>
                      <div className="text-[11px] text-zinc-500">{inst.installation_location}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase ${
                      inst.status === "VERIFIED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      inst.status === "EXPIRED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issued Digital QR Certificates */}
            <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-4">
              <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Digital Verification Certificates (Form VI)</span>
              </h3>
              <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-2">
                {certificates.map((cert) => (
                  <div key={cert.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-cyan-300 font-mono">{cert.certificate_number}</div>
                      <div className="text-xs text-zinc-400">Valid Until: {cert.valid_until?.slice(0, 10)}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[220px]">Officer: {cert.officer_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/verify/${cert.certificate_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        title="View Public QR Verification"
                      >
                        <QrCode className="w-4 h-4 text-cyan-400" />
                      </a>
                      <a
                        href={`/api/certificates/${cert.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. LMO OFFICER VIEW & 3. GATC CENTRE VIEW                */}
      {/* ======================================================== */}
      {(activeRole === "LMO" || activeRole === "GATC") && (
        <div className="space-y-10">
          {/* Header Banner for Role */}
          <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase">
                <Shield className="w-4 h-4" />
                <span>{activeRole === "LMO" ? "State Legal Metrology Department Division" : "Government Approved Test Centre Portal"}</span>
              </div>
              <h2 className="text-xl font-semibold text-[#FAFAFA] mt-1">
                {activeRole === "LMO" ? "Field Officer Inspection & Allocation Console" : "Western Maharashtra Regional Calibration GATC"}
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                {activeRole === "LMO"
                  ? "Execution of statutory Schedule VII verification tests, MPE error determinations, and digital stamp allocations."
                  : "Accredited under Section 14 (Notification MH-LM-NOTIF-GATC-2024-08). Calibration standards traceable to RRSL Pune."}
              </p>
            </div>
            {onOpenGeoModal && (
              <button
                onClick={onOpenGeoModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all self-start md:self-auto shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              >
                <Navigation className="w-4 h-4" />
                <span>Launch Mobile Field Verification</span>
              </button>
            )}
          </div>

          {/* Interactive Live Statutory MPE Tolerance Gauge */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>Real-Time Statutory MPE Field Calculation Gauge</span>
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Dynamically calculates statutory error bounds under Legal Metrology Rules for Classes I, II, III, IIII.
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-2 ${
                isWithinMPE ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}>
                {isWithinMPE ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{isWithinMPE ? "STATUTORY COMPLIANCE: PASSED" : "NON-COMPLIANT: EXCEEDS MPE"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Test Standard Load (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={testLoad}
                  onChange={(e) => setTestLoad(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Observed Reading (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={observedReading}
                  onChange={(e) => setObservedReading(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Verification Interval e (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={scaleIntervalE}
                  onChange={(e) => setScaleIntervalE(parseFloat(e.target.value) || 0.05)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Accuracy Class</label>
                <select
                  value={accClass}
                  onChange={(e) => setAccClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                >
                  <option value="CLASS_I">Class I (Special)</option>
                  <option value="CLASS_II">Class II (High)</option>
                  <option value="CLASS_III">Class III (Medium / Commercial)</option>
                  <option value="CLASS_IIII">Class IIII (Ordinary)</option>
                </select>
              </div>
            </div>

            {/* Gauge Display Card */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-wrap items-center justify-between gap-6 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block">Observed Error (Δm)</span>
                <span className={`text-base font-semibold ${isWithinMPE ? "text-emerald-400" : "text-red-400"}`}>
                  {errorVal >= 0 ? `+${errorVal}` : errorVal} kg
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Permissible MPE Limit</span>
                <span className="text-base font-semibold text-cyan-400">±{allowedMpe} kg</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Load Tier (m/e)</span>
                <span className="text-base font-semibold text-zinc-300">{verificationScaleCount.toFixed(0)} e</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Statutory Reference</span>
                <span className="text-zinc-300">Schedule VII · Table 1</span>
              </div>
            </div>
          </div>

          {/* Verification Tasks Queue */}
          <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-4">
            <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Assigned Verification Requests Queue</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-zinc-500 border-b border-white/5 uppercase">
                  <tr>
                    <th className="pb-3">Application ID</th>
                    <th className="pb-3">Scale Details</th>
                    <th className="pb-3">Trader</th>
                    <th className="pb-3">Scheduled</th>
                    <th className="pb-3">Allocation</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white">{app.application_id}</td>
                      <td className="py-3">
                        {app.instrument ? `${app.instrument.manufacturer} (${app.instrument.max_capacity}kg)` : "Standard Scale"}
                      </td>
                      <td className="py-3 text-zinc-400">{app.instrument?.owner_name || "Commercial Trader"}</td>
                      <td className="py-3 text-zinc-400">{app.scheduled_date || "Pending Date"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
                          {app.allocation_target || "LMO"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {onNavigateToInspect ? (
                          <button
                            onClick={() => onNavigateToInspect(app.id)}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500 hover:text-black text-cyan-300 text-xs font-semibold transition-all"
                          >
                            Inspect
                          </button>
                        ) : (
                          <span className="text-zinc-500">Scheduled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. STATE ENFORCEMENT ADMIN VIEW                          */}
      {/* ======================================================== */}
      {activeRole === "ADMIN" && (
        <div className="space-y-10">
          {/* Allocation Dispatcher & GATC Management */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" />
                  <span>State Allocation & GATC Center Dispatcher</span>
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Allocate verification workloads between departmental LMO field units and Government Approved Test Centres.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-zinc-500 border-b border-white/5 uppercase">
                  <tr>
                    <th className="pb-3">App Code</th>
                    <th className="pb-3">Instrument</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Current Allocation</th>
                    <th className="pb-3 text-right">Re-allocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-white font-semibold">{app.application_id}</td>
                      <td className="py-3">{app.instrument?.manufacturer} {app.instrument?.model}</td>
                      <td className="py-3 text-zinc-400">{app.status}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 text-[10px]">
                          {app.allocation_target || "LMO"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setAllocatingApp(app)}
                          className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs transition-colors"
                        >
                          Allocate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notified GATCs Directory */}
          <div className="p-6 rounded-3xl bg-[#111113] border border-white/5 space-y-4">
            <h3 className="text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Notified Government Approved Test Centres (GATCs)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gatcCentres.map((centre) => (
                <div key={centre.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-[#FAFAFA]">{centre.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono shrink-0">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">Notification: {centre.notification_number}</div>
                  <div className="text-xs text-zinc-400 font-mono">Accreditation: {centre.accreditation_body}</div>
                  <p className="text-xs text-zinc-400 line-clamp-2 pt-1">{centre.scope_of_testing}</p>
                  <div className="text-[11px] text-zinc-500 pt-1 font-mono">Signatory: {centre.authorized_signatory} ({centre.district})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      <AnimatePresence>
        {allocatingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/10 space-y-6 shadow-2xl"
            >
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">Allocate Verification Application</h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">Application: {allocatingApp.application_id}</p>
              </div>

              <form onSubmit={handleAllocate} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">Allocation Target</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAllocTarget("LMO")}
                      className={`py-2 rounded-xl text-xs font-mono border transition-all ${
                        allocTarget === "LMO" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-black/40 border-white/10 text-zinc-400"
                      }`}
                    >
                      Legal Metrology Officer (LMO)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocTarget("GATC")}
                      className={`py-2 rounded-xl text-xs font-mono border transition-all ${
                        allocTarget === "GATC" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-black/40 border-white/10 text-zinc-400"
                      }`}
                    >
                      Govt Approved Test Centre (GATC)
                    </button>
                  </div>
                </div>

                {allocTarget === "GATC" && (
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1.5">Select Notified GATC Centre</label>
                    <select
                      value={allocGatcId}
                      onChange={(e) => setAllocGatcId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    >
                      {gatcCentres.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.district})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">Scheduled Date</label>
                  <input
                    type="date"
                    value={allocDate}
                    onChange={(e) => setAllocDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAllocatingApp(null)}
                    className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all"
                  >
                    Confirm Allocation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Application Modal */}
      <AnimatePresence>
        {showAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/10 space-y-6 shadow-2xl"
            >
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">New Verification Application</h3>
                <p className="text-xs text-zinc-400 mt-1">Submit scale for statutory verification under Section 24.</p>
              </div>

              <form onSubmit={handleCreateApp} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">Select Instrument</label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                  >
                    {instruments.map((i) => (
                      <option key={i.id} value={i.id}>{i.manufacturer} {i.model} (SN: {i.serial_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5">Premises Notes / Instructions</label>
                  <textarea
                    rows={3}
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAppModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
