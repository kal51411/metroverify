import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { Search, Shield, CheckCircle, XCircle, AlertTriangle, Download, Lock, QrCode, Calendar, MapPin } from "lucide-react";

export const PublicVerify: React.FC<{ initialRef?: string }> = ({ initialRef = "" }) => {
  const [certRef, setCertRef] = useState(initialRef || "");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!certRef.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.verifyPublic(certRef.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Certificate not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) handleVerify();
    else inputRef.current?.focus();
  }, [initialRef]);

  const isValid   = result?.is_valid;
  const isExpired = result?.status === "EXPIRED";

  return (
    <div className="min-h-[80vh] flex flex-col items-center pt-16 pb-24 px-6 space-y-12">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" as const }}
        className="text-center space-y-5 max-w-lg"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-amber" />
          <span className="font-mono text-xs text-amber uppercase tracking-widest">Public Verification</span>
        </div>
        <h1 className="font-display font-bold text-5xl md:text-6xl text-warm leading-tight">
          Is this certificate genuine?
        </h1>
        <p className="text-silver text-sm leading-relaxed">
          Enter a certificate number or SHA-256 hash to verify authenticity.
          No login required. The result is cryptographically verifiable.
        </p>
      </motion.div>

      {/* ── SEARCH ── */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
        onSubmit={handleVerify}
        className="w-full max-w-xl space-y-3"
      >
        <div className="flex border border-steel bg-charcoal focus-within:border-amber transition-colors duration-200">
          <input
            ref={inputRef}
            type="text"
            required
            value={certRef}
            onChange={(e) => { setCertRef(e.target.value); setSearched(false); setResult(null); setError(null); }}
            placeholder="LM-CERT-2026-0001 or SHA-256 hash"
            className="flex-1 bg-transparent px-5 py-4 font-mono text-sm text-warm placeholder:text-steel focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-amber hover:bg-amber-light disabled:opacity-60 text-black font-mono text-xs font-bold tracking-wider transition-colors flex items-center gap-2"
          >
            {loading
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <Search className="w-4 h-4" />
                </motion.div>
              : <Search className="w-4 h-4" />
            }
            {loading ? "…" : "VERIFY"}
          </button>
        </div>
        <p className="font-mono text-[11px] text-steel text-center">
          Try: <button type="button" onClick={() => setCertRef("LM-CERT-2026-0001")} className="text-amber hover:underline">LM-CERT-2026-0001</button>
        </p>
      </motion.form>

      {/* ── RESULT ── */}
      <AnimatePresence mode="wait">
        {/* LOADING SHIMMER */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl space-y-3"
          >
            {[80, 60, 40].map((w, i) => (
              <div key={i} className={`h-4 bg-iron animate-pulse`} style={{ width: `${w}%` }} />
            ))}
          </motion.div>
        )}

        {/* ERROR */}
        {!loading && searched && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl border border-fail/30 bg-failBg px-8 py-8 text-center space-y-3"
          >
            <XCircle className="w-10 h-10 text-fail mx-auto" />
            <div className="font-display font-bold text-2xl text-fail">No Certificate Found</div>
            <p className="font-mono text-xs text-ash">
              No certificate matched <span className="text-fog">{certRef}</span>.
              Check the ID is correct and complete.
            </p>
          </motion.div>
        )}

        {/* VALID CERTIFICATE */}
        {!loading && result && isValid && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="w-full max-w-2xl"
          >
            {/* Big status banner */}
            <div className="bg-passBg border border-pass/30 px-8 py-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-10 h-10 text-pass shrink-0" />
                <div>
                  <div className="font-display font-bold text-3xl text-pass">VERIFIED</div>
                  <div className="font-mono text-xs text-pass/70 mt-0.5">Certificate is valid and has not expired</div>
                </div>
              </div>
              {result.is_demo && (
                <span className="font-mono text-[10px] px-3 py-1 bg-amber/10 text-amber border border-amber/30">
                  DEMO
                </span>
              )}
            </div>

            {/* Certificate details */}
            <div className="border border-iron border-t-0 bg-charcoal">
              {/* Certificate number */}
              <div className="border-b border-iron px-8 py-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] text-ash uppercase tracking-widest mb-1">Certificate Number</div>
                  <div className="font-mono font-bold text-2xl text-warm">{result.certificate_number}</div>
                </div>
                <QrCode className="w-8 h-8 text-steel" />
              </div>

              {/* Main fields grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-iron divide-x divide-iron">
                {[
                  { label: "INSTRUMENT TYPE", value: result.instrument_type?.replace(/_/g, " ") },
                  { label: "ACCURACY CLASS", value: result.accuracy_class?.replace("_", " ") },
                  { label: "MAX CAPACITY", value: `${result.max_capacity} ${result.unit}` },
                  { label: "MANUFACTURER", value: result.manufacturer },
                  { label: "MODEL", value: result.model },
                  { label: "SERIAL NUMBER", value: result.serial_number },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4">
                    <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-1">{label}</div>
                    <div className="font-mono text-sm font-medium text-fog">{value || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Owner + dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-iron divide-x divide-iron">
                <div className="px-5 py-4 space-y-1">
                  <div className="font-mono text-[9px] text-ash uppercase tracking-widest">Owner / Business</div>
                  <div className="font-mono text-sm text-fog">{result.business_name}</div>
                  <div className="font-mono text-[11px] text-steel flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{result.address}
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  {[
                    { label: "Verified On", value: new Date(result.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), cls: "text-fog" },
                    { label: "Valid Until", value: new Date(result.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), cls: "text-pass font-bold" },
                  ].map(({ label, value, cls }) => (
                    <div key={label}>
                      <div className="font-mono text-[9px] text-ash uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{label}
                      </div>
                      <div className={`font-mono text-sm ${cls}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic hash */}
              <div className="px-8 py-5 border-b border-iron space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber" />
                  <div className="font-mono text-[9px] text-ash uppercase tracking-widest">
                    SHA-256 Integrity Hash
                    {result.hash_verified && <span className="ml-3 text-pass font-bold">✓ VERIFIED</span>}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-steel break-all leading-relaxed">{result.certificate_hash}</div>
              </div>

              {/* Disclaimer */}
              <div className="px-8 py-4 bg-black/40">
                <div className="font-mono text-[10px] text-steel leading-relaxed">{result.disclaimer}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* EXPIRED */}
        {!loading && result && isExpired && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl border border-amber/30 bg-amber/5 px-8 py-8 text-center space-y-3"
          >
            <AlertTriangle className="w-10 h-10 text-amber mx-auto" />
            <div className="font-display font-bold text-2xl text-amber">EXPIRED</div>
            <div className="font-mono font-bold text-fog">{result.certificate_number}</div>
            <p className="font-mono text-xs text-ash">
              This certificate expired on{" "}
              <span className="text-fog">{new Date(result.valid_until).toLocaleDateString("en-IN")}</span>.
              A new verification is required.
            </p>
          </motion.div>
        )}

        {/* IDLE state */}
        {!loading && !searched && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-3 opacity-30"
          >
            <Shield className="w-12 h-12 text-steel mx-auto" />
            <div className="font-mono text-xs text-steel tracking-widest">AWAITING CERTIFICATE REFERENCE</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
