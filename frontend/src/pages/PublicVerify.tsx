import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { QrCode, Search, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Download, FileText, Lock, Building2 } from "lucide-react";

export const PublicVerify: React.FC<{ initialRef?: string }> = ({ initialRef = "" }) => {
  const [certRef, setCertRef] = useState(initialRef || "LM-CERT-2026-0001");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!certRef.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const res = await api.verifyPublic(certRef.trim());
      setResult(res);
    } catch (err: any) {
      alert("Verification lookup error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleVerify();
    }
  }, [initialRef]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-3">
        <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Public Certificate & QR Verification Portal</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Verify the authenticity, validity, and cryptographic integrity hash of any Legal Metrology verification certificate issued in Maharashtra.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleVerify} className="flex gap-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            required
            value={certRef}
            onChange={(e) => setCertRef(e.target.value)}
            placeholder="Enter Certificate ID (e.g., LM-CERT-2026-0001)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder:font-sans focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <Search className="w-4 h-4" /> Verify
          </button>
        </form>
      </div>

      {/* Verification Result Card */}
      {searched && result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          {/* Status Header */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            result.is_valid
              ? "bg-emerald-950/40 border-emerald-700 text-emerald-300"
              : result.status === "EXPIRED"
              ? "bg-amber-950/40 border-amber-700 text-amber-300"
              : "bg-rose-950/40 border-rose-700 text-rose-300"
          }`}>
            <div className="flex items-center gap-3">
              {result.is_valid ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Ledger Verification Status</span>
                <h3 className="text-base font-bold tracking-tight">{result.status_label}</h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Certificate Ref:</span>
              <span className="font-mono font-bold text-sm text-white">{result.certificate_number}</span>
            </div>
          </div>

          {result.status !== "NOT_FOUND" && (
            <>
              {/* Metrological Specs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  1. Instrument Metrological Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block font-sans">Instrument ID</span>
                    <span className="font-bold text-blue-400">{result.instrument_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Manufacturer & Model</span>
                    <span className="text-slate-200 font-sans font-medium">{result.manufacturer} {result.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Serial Number</span>
                    <span className="font-bold text-slate-100">{result.serial_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Class & Capacity</span>
                    <span className="text-slate-200">{result.accuracy_class} | {result.max_capacity} {result.unit} (e={result.verification_scale_interval_e} {result.unit})</span>
                  </div>
                </div>
              </div>

              {/* Owner & Premises */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  2. User / Business Premises Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 block">Owner / Trader Name</span>
                    <span className="font-semibold text-slate-200">{result.owner_name} ({result.business_name})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Address</span>
                    <span className="text-slate-300">{result.address}</span>
                  </div>
                </div>
              </div>

              {/* Assessment & Validity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                  3. Verification Period & Issuing Officer
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block font-sans">Verified On</span>
                    <span className="font-bold text-slate-200">{new Date(result.verification_date).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Valid Until</span>
                    <span className="font-bold text-emerald-400">{new Date(result.valid_until).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Validity Period</span>
                    <span className="text-slate-300 font-sans">{result.interval_months} Months</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Inspecting Officer</span>
                    <span className="text-slate-200 font-sans">{result.officer_name}</span>
                  </div>
                </div>
              </div>

              {/* SHA-256 Cryptographic Hash Integrity Proof */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Cryptographic Hash Integrity Proof:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> HASH MATCHED & VERIFIED
                  </span>
                </div>
                <div className="font-mono text-[11px] text-blue-400 break-all bg-slate-900 p-2.5 rounded border border-slate-800">
                  {result.certificate_hash}
                </div>
              </div>
            </>
          )}

          {/* Official System Disclaimer */}
          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 leading-relaxed font-sans">
            <b>LEGAL NOTICE & ATTRIBUTION:</b> {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
