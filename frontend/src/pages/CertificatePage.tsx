import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  RotateCcw, CheckCircle2, Lock, Download, QrCode, Calendar, MapPin, User, Scale
} from "lucide-react";

export const CertificatePage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  useEffect(() => {
    api.getCertificates()
      .then(data => { setCertificates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RotateCcw className="w-5 h-5 animate-spin text-blue-500" />
        <span className="font-mono text-xs text-slate-400 tracking-widest">LOADING CERTIFICATE LEDGER…</span>
      </div>
    );
  }

  if (!selectedCert) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs text-emerald-400 font-bold tracking-widest">SCHEDULE IX CERTIFICATES</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight">Certificate Ledger</h2>
          <p className="text-sm text-slate-400 mt-1">All issued legal-metrology verification certificates with cryptographic integrity hashes.</p>
        </div>

        {certificates.length === 0 ? (
          <div className="border border-slate-800 py-20 text-center">
            <div className="font-display text-xl font-bold text-slate-500 mb-2">NO CERTIFICATES ISSUED</div>
            <p className="font-mono text-xs text-slate-600">Complete an inspection and generate a certificate to populate this ledger.</p>
          </div>
        ) : (
          <div className="border border-slate-800">
            <div className="grid grid-cols-12 border-b border-slate-800 px-4 py-2 bg-[#05080e]">
              {["CERTIFICATE NO.", "INSTRUMENT", "OWNER", "VERIFIED", "VALID UNTIL", "STATUS", ""].map((h, i) => (
                <div key={h} className={`font-mono text-[10px] text-slate-600 tracking-widest ${
                  i === 0 ? "col-span-2" : i === 1 ? "col-span-2" : i === 2 ? "col-span-3" :
                  i === 3 ? "col-span-2" : i === 4 ? "col-span-1" : i === 5 ? "col-span-1" : "col-span-1"
                }`}>{h}</div>
              ))}
            </div>

            {certificates.map(cert => {
              const inst = cert.instrument;
              const now = new Date();
              const validUntil = new Date(cert.valid_until);
              const isActive = cert.status === "ACTIVE" && validUntil > now;

              return (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className="grid grid-cols-12 border-b border-slate-800 px-4 py-4 hover:bg-slate-900/30 cursor-pointer transition items-center"
                >
                  <div className="col-span-2 font-mono text-xs font-bold text-blue-400">{cert.certificate_number}</div>
                  <div className="col-span-2">
                    <div className="font-mono text-xs text-slate-300">{inst?.instrument_type?.replace(/_/g, " ") || "—"}</div>
                    <div className="font-mono text-[10px] text-slate-500">{inst?.model}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-xs text-slate-300 truncate">{inst?.owner_name || "—"}</div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">{inst?.business_name}</div>
                  </div>
                  <div className="col-span-2 font-mono text-xs text-slate-400">
                    {new Date(cert.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className={`col-span-1 font-mono text-xs font-bold ${isActive ? "text-emerald-400" : "text-rose-400"}`}>
                    {validUntil.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="col-span-1">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${
                      isActive ? "text-emerald-400 border-emerald-800 bg-emerald-950/30" : "text-rose-400 border-rose-800 bg-rose-950/30"
                    }`}>{isActive ? "VALID" : "EXPIRED"}</span>
                  </div>
                  <div className="col-span-1 text-slate-600 font-mono text-xs hover:text-blue-400 transition">
                    VIEW →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── SINGLE CERTIFICATE DETAIL VIEW (DOCUMENT-LIKE) ──────────────────
  const inst = selectedCert.instrument;
  const validUntil = new Date(selectedCert.valid_until);
  const isActive = selectedCert.status === "ACTIVE" && validUntil > new Date();

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-0">
      {/* Back */}
      <button onClick={() => setSelectedCert(null)} className="font-mono text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition mb-6">
        ← CERTIFICATE LEDGER
      </button>

      {/* Document */}
      <div className="border border-slate-700 bg-[#080c14]">
        {/* Document Header */}
        <div className="border-b border-slate-700 px-8 py-6 flex items-start justify-between gap-4 bg-[#05080e]">
          <div>
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-2">System-Generated Digital Verification Record</div>
            <div className="font-mono text-[10px] text-slate-600 mb-4">Legal Metrology Act, 2009 & (General) Rules 2011 (Amended 2025/2026)</div>
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">VERIFICATION CERTIFICATE</div>
            <div className="font-display font-extrabold text-3xl text-white tracking-tight mt-1">{selectedCert.certificate_number}</div>
          </div>
          <div className={`flex flex-col items-center px-4 py-3 border ${isActive ? "border-emerald-700 bg-emerald-950/30" : "border-rose-700 bg-rose-950/30"}`}>
            <CheckCircle2 className={`w-6 h-6 mb-1 ${isActive ? "text-emerald-400" : "text-rose-400"}`} />
            <div className={`font-mono text-xs font-bold ${isActive ? "text-emerald-400" : "text-rose-400"}`}>
              {isActive ? "VALID" : "EXPIRED"}
            </div>
          </div>
        </div>

        {/* Instrument Details */}
        <div className="border-b border-slate-800 px-8 py-5 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-3 pb-2 border-b border-slate-800">INSTRUMENT</div>
          </div>
          {[
            { label: "TYPE", value: inst?.instrument_type?.replace(/_/g, " ") },
            { label: "CLASS", value: inst?.accuracy_class?.replace("_", " ") },
            { label: "MANUFACTURER", value: inst?.manufacturer },
            { label: "MODEL", value: inst?.model },
            { label: "SERIAL NUMBER", value: inst?.serial_number },
            { label: "MODEL APPROVAL", value: inst?.model_approval_number },
            { label: "MAX CAPACITY", value: `${inst?.max_capacity} ${inst?.unit}` },
            { label: "MIN CAPACITY", value: `${inst?.min_capacity} ${inst?.unit}` },
            { label: "SCALE INTERVAL e", value: `${inst?.verification_scale_interval_e} ${inst?.unit}` },
            { label: "ACTUAL INTERVAL d", value: `${inst?.actual_scale_interval_d} ${inst?.unit}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">{label}</div>
              <div className="font-mono text-sm font-medium text-slate-200 mt-0.5">{value || "—"}</div>
            </div>
          ))}
        </div>

        {/* Owner */}
        <div className="border-b border-slate-800 px-8 py-5 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-3 pb-2 border-b border-slate-800">OWNER / BUSINESS</div>
          </div>
          {[
            { label: "NAME", value: inst?.owner_name },
            { label: "BUSINESS", value: inst?.business_name },
            { label: "ADDRESS", value: inst?.address },
            { label: "DISTRICT / DIVISION", value: `${inst?.district} / ${inst?.division}` },
          ].map(({ label, value }) => (
            <div key={label} className={label === "ADDRESS" || label === "BUSINESS" ? "col-span-2" : ""}>
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">{label}</div>
              <div className="font-mono text-sm font-medium text-slate-200 mt-0.5">{value || "—"}</div>
            </div>
          ))}
        </div>

        {/* Verification Details */}
        <div className="border-b border-slate-800 px-8 py-5 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-3 pb-2 border-b border-slate-800">VERIFICATION DETAILS</div>
          </div>
          {[
            { label: "VERIFICATION DATE", value: new Date(selectedCert.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
            { label: "VALID UNTIL", value: validUntil.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
            { label: "INTERVAL", value: `${selectedCert.interval_months} months` },
            { label: "RESULT", value: selectedCert.result },
            { label: "TEST LOCATION", value: selectedCert.test_location },
            { label: "RULESET VERSION", value: selectedCert.ruleset_version },
          ].map(({ label, value }) => (
            <div key={label} className={label === "RULESET VERSION" || label === "TEST LOCATION" ? "col-span-2" : ""}>
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">{label}</div>
              <div className={`font-mono text-sm font-medium mt-0.5 ${label === "RESULT" ? (value === "PASS" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold") : "text-slate-200"}`}>{value || "—"}</div>
            </div>
          ))}
        </div>

        {/* Officer Seal */}
        <div className="border-b border-slate-800 px-8 py-5 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-3 pb-2 border-b border-slate-800">ISSUING AUTHORITY</div>
          </div>
          {[
            { label: "OFFICER NAME", value: selectedCert.officer_name },
            { label: "DESIGNATION", value: selectedCert.officer_designation },
            { label: "OFFICE", value: selectedCert.office_name },
            { label: "FEE REFERENCE (GRAS)", value: selectedCert.fee_reference },
          ].map(({ label, value }) => (
            <div key={label} className={label === "OFFICE" ? "col-span-2" : ""}>
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">{label}</div>
              <div className="font-mono text-sm font-medium text-slate-200 mt-0.5">{value || "—"}</div>
            </div>
          ))}
        </div>

        {/* QR Token & Cryptographic Hash */}
        <div className="px-8 py-5 bg-[#05080e] space-y-4">
          <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase pb-2 border-b border-slate-800">CRYPTOGRAPHIC INTEGRITY</div>
          <div>
            <div className="font-mono text-[10px] text-slate-600 tracking-widest">QR TOKEN</div>
            <div className="font-mono text-xs text-slate-300 mt-0.5">{selectedCert.qr_token}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <div className="font-mono text-[10px] text-slate-600 tracking-widest">SHA-256 CERTIFICATE HASH</div>
            </div>
            <div className="font-mono text-xs text-slate-400 break-all leading-relaxed bg-[#080c14] p-3 border border-slate-800">{selectedCert.certificate_hash}</div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`/api/certificates/${selectedCert.id}/pdf`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold border border-blue-400/40 transition"
            >
              <Download className="w-3.5 h-3.5" /> DOWNLOAD PDF
            </a>
            <a
              href={`/api/verify/${selectedCert.certificate_number}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" /> PUBLIC VERIFY
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
