import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, QrCode, Download, FileText, CheckCircle2, AlertTriangle, Scale, Building, ExternalLink } from "lucide-react";
import { api } from "../api/client";

interface UniversalLedgerSearchProps {
  onSelectCert?: (certId: string) => void;
}

export function UniversalLedgerSearch({ onSelectCert }: UniversalLedgerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("SYNTH");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({
    match_count: 0,
    certificates: [],
    instruments: [],
    seals: []
  });

  const performSearch = async (term: string) => {
    if (!term || term.trim().length === 0) return;
    try {
      setLoading(true);
      const data = await api.searchRepository(term);
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(searchTerm);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory Centralized Repository & Public Ledger</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold text-[#FAFAFA] tracking-tight">
          Verify Any Scale or Certificate
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
          Query the tamper-evident ledger by Certificate Number, Scale Serial, QR Token, or Trader Business Name.
        </p>
      </div>

      {/* Spotlight Search Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search e.g. LM-CERT-2026-001, SYNTH-DS-2026, Sharma Agro..."
            className="w-full pl-12 pr-28 py-3.5 rounded-full bg-[#111113] border border-white/10 text-white placeholder-zinc-500 font-mono text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none shadow-xl transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 rounded-full bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Match Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/5">
          <span>Found {results.match_count} matching records</span>
          <a href="/api/repository/export?format=csv" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </a>
        </div>

        {/* Certificates Results */}
        {results.certificates && results.certificates.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Verification Certificates ({results.certificates.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.certificates.map((cert: any) => (
                <div key={cert.id} className="p-5 rounded-2xl bg-[#111113] border border-white/10 space-y-3 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-semibold">{cert.certificate_number}</span>
                      <h4 className="text-sm font-medium text-[#FAFAFA] mt-0.5">
                        {cert.instrument ? `${cert.instrument.manufacturer} ${cert.instrument.model}` : "Commercial Instrument"}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                      cert.is_valid ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {cert.is_valid ? "AUTHENTIC & VALID" : "EXPIRED"}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 font-mono space-y-1">
                    <div>Serial: <span className="text-zinc-200">{cert.instrument?.serial_number || "N/A"}</span></div>
                    <div>Owner: <span className="text-zinc-200">{cert.instrument?.owner_name || "N/A"}</span> ({cert.instrument?.business_name})</div>
                    <div>Validity: {cert.verification_date} to {cert.valid_until}</div>
                    <div className="truncate text-[10px] text-zinc-500">Hash: {cert.certificate_hash}</div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px]">By {cert.officer_name}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/verify/${cert.certificate_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors"
                        title="QR Verification"
                      >
                        <QrCode className="w-4 h-4" />
                      </a>
                      <a
                        href={`/api/certificates/${cert.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instruments Results */}
        {results.instruments && results.instruments.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Instruments in Database ({results.instruments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.instruments.map((inst: any) => (
                <div key={inst.id} className="p-4 rounded-2xl bg-[#111113] border border-white/5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-[#FAFAFA]">{inst.manufacturer} {inst.model}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">{inst.status}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">Serial: {inst.serial_number}</div>
                  <div className="text-xs text-zinc-400 font-mono">{inst.accuracy_class} · {inst.max_capacity} {inst.unit}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{inst.owner_name} ({inst.district})</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
