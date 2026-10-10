import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Upload, Sparkles, CheckCircle2, FileText, ArrowRight, ShieldCheck, Cpu, Scale, AlertCircle } from "lucide-react";

export function AIInspectionAssistant() {
  const shouldReduceMotion = useReducedMotion();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setError(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("metro_token") || "";
      const res = await fetch("/api/v3/ai/ocr-plate", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to parse scale plate image.");
      }
      const data = await res.json();
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during OCR extraction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="pb-8 border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Neural Vision & Statutory OCR Assistor</span>
        </div>
        <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-[#FAFAFA] tracking-[-0.03em]">
          AI Stamping Plate Parser
        </h1>
        <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
          Upload an on-site photograph of a scale nameplate or verification slip for automated statutory metadata extraction via backend neural OCR service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Upload Zone */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <h3 className="font-sans font-semibold text-lg text-[#FAFAFA] mb-6 flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>Upload Stamping Plate Image</span>
          </h3>

          <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 sm:p-12 text-center hover:border-cyan-500/40 transition-colors relative group bg-white/[0.01]">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-8 h-8" />
            </div>
            <p className="font-sans font-semibold text-[#FAFAFA] text-base mb-1">
              {file ? file.name : "Drop stamping plate image here, or browse"}
            </p>
            <p className="text-xs text-zinc-500 font-mono">High-resolution camera capture recommended (PNG, JPG, WEBP)</p>

            {/* Scanning beam animation when loading */}
            {loading && (
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.8)] pointer-events-none"
              />
            )}
          </div>

          {file && (
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <span className="text-xs font-mono text-zinc-400 truncate max-w-[260px]">{file.name}</span>
              <button
                onClick={handleUploadAndParse}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing Neural OCR...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Statutory Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Extracted Metadata Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <h3 className="font-sans font-semibold text-lg text-[#FAFAFA] mb-6 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Parsed Legal Metrology Attributes</span>
          </h3>

          {!extractedData ? (
            <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white/[0.01] border border-white/5">
              <Sparkles className="w-8 h-8 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400 font-medium">No stamping plate processed yet</p>
              <p className="text-xs text-zinc-600 max-w-xs mt-1">Upload a photo to automatically parse serial numbers, approval marks, accuracy class, and e-intervals.</p>
            </div>
          ) : (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4 font-mono text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-zinc-500 block mb-1">Serial Number</span>
                  <span className="text-cyan-400 font-bold text-sm">{extractedData.serial_number}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-zinc-500 block mb-1">Model Approval Code</span>
                  <span className="text-[#FAFAFA] font-bold text-sm">{extractedData.model}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Manufacturer:</span>
                  <span className="text-[#FAFAFA]">{extractedData.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Maximum Capacity (Max):</span>
                  <span className="text-[#FAFAFA] font-bold">{extractedData.max_capacity} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verification Interval (e):</span>
                  <span className="text-[#FAFAFA] font-bold">{extractedData.verification_scale_interval_e} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Accuracy Classification:</span>
                  <span className="text-cyan-400 font-bold">{extractedData.accuracy_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">National Model Approval No:</span>
                  <span className="text-[#FAFAFA]">{extractedData.model_approval_number}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OCR Confidence: {(extractedData.ocr_confidence * 100).toFixed(1)}%</span>
                </div>
                <span className="font-bold">STATUTORY COMPLIANT</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
