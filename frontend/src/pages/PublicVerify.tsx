import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  Search, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, Download, Shield, Calendar, MapPin, Lock
} from "lucide-react";

export const PublicVerify: React.FC<{ initialRef?: string }> = ({ initialRef = "" }) => {
  const [certRef, setCertRef] = useState(initialRef || "");
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
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) handleVerify();
  }, [initialRef]);

  const isValid = result?.is_valid;
  const isExpired = result?.status === "EXPIRED";
  const statusColor = isValid ? "emerald" : isExpired ? "amber" : "rose";
  const statusLabel = isValid ? "VALID & ACTIVE" : isExpired ? "EXPIRED" : "NOT FOUND / INVALID";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-12 pb-16 space-y-8 w-full">
      {/* ── HEADER ────────────────────────────────────── */}
      <div className="text-center space-y-3 max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">Public Verification Lookup</span>
        </div>
        <h1 className="font-display text-4xl font-extrabold text-white tracking-tight">
          VERIFY CERTIFICATE
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Confirm the authenticity and current validity of a legal-metrology verification certificate. Enter the certificate ID or SHA-256 hash from the QR code.
        </p>
      </div>

      {/* ── SEARCH INPUT ──────────────────────────────── */}
      <form onSubmit={handleVerify} className="w-full max-w-xl space-y-3">
        <div className="flex border border-slate-700 bg-[#0a0f1d] focus-within:border-blue-500 transition">
          <input
            type="text"
            required
            value={certRef}
            onChange={(e) => { setCertRef(e.target.value); setSearched(false); setResult(null); }}
            placeholder="LM-CERT-2026-0001 or SHA-256 hash..."
            className="flex-1 bg-transparent px-5 py-4 font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-mono text-xs font-bold tracking-wider border-l border-blue-500 flex items-center gap-2 transition"
          >
            {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            VERIFY
          </button>
        </div>
        <p className="font-mono text-[11px] text-slate-600 text-center">
          No login required. This lookup is publicly accessible.
        </p>
      </form>

      {/* ── RESULT ────────────────────────────────────── */}
      {searched && result && (
        <div className="w-full max-w-xl space-y-0 border border-slate-800">
          {/* Status Banner */}
          <div className={`flex items-center justify-between px-6 py-5 border-b border-slate-800 ${
            isValid ? "bg-emerald-950/40" : isExpired ? "bg-amber-950/40" : "bg-rose-950/40"
          }`}>
            <div className="flex items-center gap-3">
              {isValid
                ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                : isExpired
                  ? <AlertTriangle className="w-8 h-8 text-amber-400" />
                  : <XCircle className="w-8 h-8 text-rose-400" />
              }
              <div>
                <div className={`font-display font-extrabold text-2xl tracking-tight ${
                  isValid ? "text-emerald-400" : isExpired ? "text-amber-400" : "text-rose-400"
                }`}>
                  {isValid ? "✓ VALID" : isExpired ? "! EXPIRED" : "✕ NOT FOUND"}
                </div>
                <div className={`font-mono text-xs ${
                  isValid ? "text-emerald-600" : isExpired ? "text-amber-600" : "text-rose-600"
                }`}>
                  {statusLabel}
                </div>
              </div>
            </div>
            {result.is_demo && (
              <span className="font-mono text-[10px] px-2 py-1 bg-amber-900/60 text-amber-400 border border-amber-700">
                DEMO DATA
              </span>
            )}
          </div>

          {/* Certificate Core Details */}
          {isValid && (
            <>
              <div className="px-6 py-4 border-b border-slate-800 bg-[#080c14] space-y-4">
                {/* Certificate Number Large */}
                <div>
                  <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-1">Certificate Number</div>
                  <div className="font-mono text-xl font-bold text-white">{result.certificate_number}</div>
                </div>

                {/* Key Fields Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "INSTRUMENT", value: `${result.instrument_type?.replace(/_/g, " ")}` },
                    { label: "ACCURACY CLASS", value: result.accuracy_class?.replace("_", " ") },
                    { label: "MANUFACTURER", value: result.manufacturer },
                    { label: "MODEL", value: result.model },
                    { label: "SERIAL NUMBER", value: result.serial_number },
                    { label: "MAX CAPACITY", value: `${result.max_capacity} ${result.unit}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                      <div className="font-mono text-sm font-medium text-slate-200 mt-0.5">{value || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner & Dates */}
              <div className="px-6 py-4 border-b border-slate-800 bg-[#05080e] grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">BUSINESS</div>
                  <div className="font-mono text-xs text-slate-300 mt-0.5">{result.business_name}</div>
                  <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {result.address}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">VERIFIED ON</div>
                    <div className="font-mono text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(result.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">VALID UNTIL</div>
                    <div className={`font-mono text-xs font-bold mt-0.5 ${isValid ? "text-emerald-400" : "text-rose-400"}`}>
                      {new Date(result.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Officer & Office */}
              <div className="px-6 py-4 border-b border-slate-800 bg-[#080c14] grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">ISSUING OFFICER</div>
                  <div className="font-mono text-xs text-slate-300 mt-0.5">{result.officer_name}</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">{result.office_name}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">RULESET</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5 leading-relaxed">{result.ruleset_version}</div>
                </div>
              </div>

              {/* Cryptographic Hash */}
              <div className="px-6 py-4 bg-[#05080e] space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
                    Cryptographic Integrity Hash
                    {result.hash_verified && <span className="ml-2 text-emerald-500 font-bold">✓ VERIFIED</span>}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-slate-400 break-all leading-relaxed">{result.certificate_hash}</div>
                <p className="font-mono text-[10px] text-slate-600 leading-relaxed">{result.disclaimer}</p>
              </div>
            </>
          )}

          {/* Not Found State */}
          {!isValid && !isExpired && (
            <div className="px-6 py-8 bg-[#080c14] text-center space-y-3">
              <div className="font-display text-lg font-bold text-slate-400">NO CERTIFICATE MATCHED</div>
              <p className="font-mono text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Check the certificate ID and try again. Ensure you are using the full certificate number or the complete SHA-256 hash from the QR code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!searched && (
        <div className="text-center space-y-2 opacity-40">
          <Shield className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="font-mono text-xs text-slate-600 tracking-widest">AWAITING CERTIFICATE REFERENCE</div>
        </div>
      )}
    </div>
  );
};
