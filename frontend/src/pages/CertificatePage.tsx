import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api/client";
import { CheckCircle, Lock, QrCode, Download, ChevronLeft } from "lucide-react";

export const CertificatePage: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.getCertificates()
      .then(data => { setCerts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <CheckCircle className="w-6 h-6 text-pass animate-pulse" />
      <span className="font-mono text-sm text-ash">Loading certificate ledger…</span>
    </div>
  );

  if (selected) {
    const inst = selected.instrument;
    const valid = selected.status === "ACTIVE" && new Date(selected.valid_until) > new Date();

    return (
      <div className="max-w-2xl mx-auto pb-16 space-y-6">
        <button onClick={() => setSelected(null)} className="font-mono text-xs text-ash hover:text-amber transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> Certificate Ledger
        </button>

        {/* CERTIFICATE DOCUMENT */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="cert-paper"
        >
          {/* Header */}
          <div className="border-b border-[#3a3530] px-8 py-7 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-mono text-[9px] text-[#555] uppercase tracking-widest">
                System-Generated Certificate · Legal Metrology Act, 2009
              </div>
              <div className="font-mono text-[10px] text-[#666] uppercase tracking-widest mt-3 mb-1">
                Verification Certificate
              </div>
              <div className="font-display font-bold text-3xl text-ivory">{selected.certificate_number}</div>
            </div>
            <div className={`flex flex-col items-center px-4 py-3 border ${valid ? "border-pass/40 bg-pass/5" : "border-fail/40 bg-fail/5"}`}>
              <CheckCircle className={`w-5 h-5 mb-1 ${valid ? "text-pass" : "text-fail"}`} />
              <div className={`font-mono text-[10px] font-bold ${valid ? "text-pass" : "text-fail"}`}>
                {valid ? "VALID" : "EXPIRED"}
              </div>
            </div>
          </div>

          {/* Instrument section */}
          <div className="border-b border-[#2a2824] px-8 py-6">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-4">Instrument</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Type", value: inst?.instrument_type?.replace(/_/g, " ") },
                { label: "Class", value: inst?.accuracy_class?.replace("_", " ") },
                { label: "Manufacturer", value: inst?.manufacturer },
                { label: "Model", value: inst?.model },
                { label: "Serial Number", value: inst?.serial_number },
                { label: "Model Approval", value: inst?.model_approval_number },
                { label: "Max Capacity", value: `${inst?.max_capacity} ${inst?.unit}` },
                { label: "Scale Interval e", value: `${inst?.verification_scale_interval_e} ${inst?.unit}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="font-mono text-sm font-medium text-[#d0cdc8]">{value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Owner section */}
          <div className="border-b border-[#2a2824] px-8 py-6">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-4">Owner / Business</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Name", value: inst?.owner_name },
                { label: "Business", value: inst?.business_name, wide: true },
                { label: "Address", value: inst?.address, wide: true },
                { label: "District / Division", value: `${inst?.district} / ${inst?.division}` },
              ].map(({ label, value, wide }) => (
                <div key={label} className={wide ? "col-span-2" : ""}>
                  <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="font-mono text-sm font-medium text-[#d0cdc8]">{value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification details */}
          <div className="border-b border-[#2a2824] px-8 py-6">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-4">Verification</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Verified On", value: new Date(selected.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
                { label: "Valid Until", value: new Date(selected.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }), highlight: valid },
                { label: "Result", value: selected.result, pass: true },
                { label: "Interval", value: `${selected.interval_months} months` },
                { label: "Location", value: selected.test_location, wide: true },
                { label: "Ruleset", value: selected.ruleset_version, wide: true },
              ].map(({ label, value, pass, highlight, wide }: any) => (
                <div key={label} className={wide ? "col-span-2" : ""}>
                  <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                  <div className={`font-mono text-sm font-medium ${pass ? (value === "PASS" ? "text-pass font-bold" : "text-fail font-bold") : highlight ? "text-pass font-bold" : "text-[#d0cdc8]"}`}>
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Officer */}
          <div className="border-b border-[#2a2824] px-8 py-6">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-4">Issuing Authority</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Officer", value: selected.officer_name },
                { label: "Designation", value: selected.officer_designation },
                { label: "Office", value: selected.office_name, wide: true },
              ].map(({ label, value, wide }: any) => (
                <div key={label} className={wide ? "col-span-2" : ""}>
                  <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="font-mono text-sm font-medium text-[#d0cdc8]">{value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Crypto */}
          <div className="px-8 py-6 bg-[#0e0d0b] space-y-4">
            <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber" /> Cryptographic Integrity
            </div>
            <div>
              <div className="font-mono text-[9px] text-[#444] mb-1">QR Token</div>
              <div className="font-mono text-[11px] text-[#666]">{selected.qr_token}</div>
            </div>
            <div>
              <div className="font-mono text-[9px] text-[#444] mb-1">SHA-256 Certificate Hash</div>
              <div className="font-mono text-[10px] text-[#555] break-all leading-relaxed">{selected.certificate_hash}</div>
            </div>

            <div className="flex flex-wrap gap-3 pt-3">
              <a
                href={`/api/certificates/${selected.id}/pdf`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber hover:bg-amber-light text-black font-mono text-xs font-bold transition-colors no-print"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
              <a
                href={`/api/verify/${selected.certificate_number}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 border border-[#3a3530] text-[#aaa] font-mono text-xs hover:border-amber hover:text-amber transition-colors no-print"
              >
                <QrCode className="w-3.5 h-3.5" /> Public Verify
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-iron pb-6">
        <h2 className="font-display font-bold text-4xl text-warm tracking-tight">Certificate Ledger</h2>
        <p className="text-silver text-sm mt-1.5">All issued Schedule IX verification certificates.</p>
      </div>

      {certs.length === 0 ? (
        <div className="border border-iron py-20 text-center bg-charcoal">
          <div className="font-display text-2xl font-bold text-steel mb-2">No Certificates</div>
          <p className="font-mono text-xs text-ash">Complete an inspection and generate a certificate to populate this ledger.</p>
        </div>
      ) : (
        <div className="border border-iron">
          <div className="grid grid-cols-12 border-b border-iron px-4 py-2.5 bg-onyx">
            {[
              { label: "Certificate No.", span: "col-span-2" },
              { label: "Instrument", span: "col-span-2" },
              { label: "Owner", span: "col-span-3" },
              { label: "Verified", span: "col-span-2" },
              { label: "Valid Until", span: "col-span-1" },
              { label: "Status", span: "col-span-1" },
              { label: "", span: "col-span-1" },
            ].map(({ label, span }) => (
              <div key={label} className={`${span} font-mono text-[9px] text-ash uppercase tracking-widest`}>{label}</div>
            ))}
          </div>

          {certs.map((cert, idx) => {
            const inst = cert.instrument;
            const valid = cert.status === "ACTIVE" && new Date(cert.valid_until) > new Date();
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setSelected(cert)}
                className="grid grid-cols-12 border-b border-iron px-4 py-4 hover:bg-charcoal cursor-pointer transition-colors items-center"
              >
                <div className="col-span-2 font-mono text-xs font-bold text-amber">{cert.certificate_number}</div>
                <div className="col-span-2 space-y-0.5">
                  <div className="font-mono text-xs text-fog">{inst?.instrument_type?.replace(/_/g, " ") || "—"}</div>
                  <div className="font-mono text-[9px] text-steel">{inst?.model}</div>
                </div>
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <div className="text-xs text-fog truncate">{inst?.owner_name || "—"}</div>
                  <div className="font-mono text-[9px] text-steel truncate">{inst?.business_name}</div>
                </div>
                <div className="col-span-2 font-mono text-xs text-ash">
                  {new Date(cert.verification_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div className={`col-span-1 font-mono text-xs font-bold ${valid ? "text-pass" : "text-fail"}`}>
                  {new Date(cert.valid_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </div>
                <div className="col-span-1">
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 border ${valid ? "text-pass border-pass/30 bg-passBg" : "text-fail border-fail/30 bg-failBg"}`}>
                    {valid ? "VALID" : "EXPIRED"}
                  </span>
                </div>
                <div className="col-span-1 font-mono text-[10px] text-steel hover:text-amber transition-colors">
                  VIEW →
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
