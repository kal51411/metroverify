import React from "react";
import { Scale, ShieldCheck, QrCode, FileCheck, ArrowRight, Activity, Terminal, ShieldAlert } from "lucide-react";

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-12">
      {/* SECTION 1: HERO (ART-DIRECTED EDITORIAL VIEWPORT) */}
      <section className="relative border-b border-slate-800 pb-16 pt-6">
        {/* Subtle Background Calibration Grid & Axis */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
        
        {/* Horizontal Technical Ruler Marker */}
        <div className="w-full h-4 ruler-ticks mb-6 opacity-30"></div>

        <div className="relative z-10 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Asymmetrical Editorial Heading & Metadata */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800 font-bold uppercase">
                DIGITAL LEGAL METROLOGY INFRASTRUCTURE
              </span>
              <span>•</span>
              <span className="text-slate-400">STATE ENFORCEMENT FRAMEWORK</span>
              <span>•</span>
              <span className="text-blue-400 font-bold">2026.4 RULESET</span>
            </div>

            {/* Main Editorial Large Typography */}
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white leading-none">
              MEASURE.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-200 to-slate-400">VERIFY.</span><br />
              <span className="text-blue-500">TRUST.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl font-sans leading-relaxed">
              Deterministic metrological verification, automated MPE evaluation, statutory fee scrutiny, and append-only cryptographic verification ledgers under the Legal Metrology Act, 2009.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onNavigate("inspector")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold tracking-wider border border-blue-400/40 shadow-lg shadow-blue-900/30 flex items-center gap-2 transition"
              >
                <span>LAUNCH INSPECTOR WORKSTATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onNavigate("verify")}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold tracking-wider border border-slate-700 flex items-center gap-2 transition"
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>PUBLIC VERIFY LOOKUP</span>
              </button>
            </div>
          </div>

          {/* Right Column: Narrow Technical Rail */}
          <div className="lg:col-span-4 bg-[#0a0f1d] border border-slate-800 p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">[SYSTEM SPECIFICATION]</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">MPE TABLES</span>
                <span className="text-slate-200 font-bold">CLASS I, II, III, IIII</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">WEIGHBRIDGE 2026</span>
                <span className="text-blue-400 font-bold">1/2, 1/3, 1/5 MAX</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">FEE SCHEDULE</span>
                <span className="text-slate-200">MAHARASHTRA 2018</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">AUDIT LEDGER</span>
                <span className="text-emerald-400 font-bold">SHA-256 CHAIN</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">CERTIFICATE</span>
                <span className="text-slate-200">SCHEDULE IX DIGITAL</span>
              </div>
            </div>

            <div className="bg-[#05080f] p-4 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
              <div className="text-slate-500 font-bold uppercase">[STATUTORY COMPLIANCE]</div>
              <p className="text-slate-300">Automated verification execution engine operating under Indian Legal Metrology Rules.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: EDITORIAL RHYTHM (01 TO 06 STORY STEPS - VARIABLE LAYOUTS) */}
      <section className="space-y-16">
        <div className="border-l-2 border-blue-600 pl-4">
          <span className="font-mono text-xs text-blue-400 font-bold tracking-widest uppercase">STATUTORY WORKFLOW ARCHITECTURE</span>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight">The 6 Pillars of Legal Metrology Verification</h2>
        </div>

        {/* 01 MEASURE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0a0f1d] border border-slate-800 p-8">
          <div className="md:col-span-3 font-mono">
            <span className="text-5xl font-extrabold text-blue-500/40">01</span>
            <h3 className="text-xl font-bold text-white mt-1">MEASURE</h3>
            <span className="text-xs text-slate-400 block mt-1">NPL & RRSL Traceable Standards</span>
          </div>
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-l border-slate-800 md:pl-8">
            Every inspection requires linked reference standard masses with active calibration certificates from Regional Reference Standard Laboratories (RRSL) or National Physical Laboratory (NPL). The engine prevents inspection completion if standard weights are expired or missing.
          </div>
        </div>

        {/* 02 INSPECT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#080c14] border border-slate-800 p-8">
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-r border-slate-800 md:pr-8">
            Field testing follows deterministic steps: visual integrity check, zero setting within 0.25e, MPE load progression (Min, 500e, 2000e, Max), 3-run repeatability test, 5-position eccentricity test, discrimination (+1.4d), tare visibility, and zero return.
          </div>
          <div className="md:col-span-3 font-mono text-right">
            <span className="text-5xl font-extrabold text-blue-500/40">02</span>
            <h3 className="text-xl font-bold text-white mt-1">INSPECT</h3>
            <span className="text-xs text-slate-400 block mt-1">8-Step Statutory Test Routine</span>
          </div>
        </div>

        {/* 03 CALCULATE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0a0f1d] border border-slate-800 p-8">
          <div className="md:col-span-3 font-mono">
            <span className="text-5xl font-extrabold text-blue-500/40">03</span>
            <h3 className="text-xl font-bold text-white mt-1">CALCULATE</h3>
            <span className="text-xs text-slate-400 block mt-1">MPE & 2026 Substitution Rules</span>
          </div>
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-l border-slate-800 md:pl-8">
            Computes exact Maximum Permissible Error (MPE) thresholds for Class I, II, III, IIII instruments. Evaluates the July 2026 4th Amendment rule for high-capacity weighbridges (&gt;10T), dynamically calculating standard weight requirements of 1/2 Max, 1/3 Max (&le;0.3e), or 1/5 Max (&le;0.2e).
          </div>
        </div>

        {/* 04 VERIFY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#080c14] border border-slate-800 p-8">
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-r border-slate-800 md:pr-8">
            Verifies territorial jurisdiction across all 8 administrative divisions and 36 districts of Maharashtra. Applies the 2018 Statutory Fee Schedule notification rules and tracks Maharashtra GRAS (Government Receipt Accounting System) payment references.
          </div>
          <div className="md:col-span-3 font-mono text-right">
            <span className="text-5xl font-extrabold text-blue-500/40">04</span>
            <h3 className="text-xl font-bold text-white mt-1">VERIFY</h3>
            <span className="text-xs text-slate-400 block mt-1">Jurisdiction & GRAS Payment</span>
          </div>
        </div>

        {/* 05 CERTIFY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0a0f1d] border border-slate-800 p-8">
          <div className="md:col-span-3 font-mono">
            <span className="text-5xl font-extrabold text-blue-500/40">05</span>
            <h3 className="text-xl font-bold text-white mt-1">CERTIFY</h3>
            <span className="text-xs text-slate-400 block mt-1">Schedule IX Digital Certificates</span>
          </div>
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-l border-slate-800 md:pl-8">
            Issues tamper-evident Schedule IX verification certificates with embedded QR codes, officer credentials, statutory validity periods (12/24 months), security seal serial numbers, and ReportLab high-resolution digital PDFs.
          </div>
        </div>

        {/* 06 TRUST */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#080c14] border border-slate-800 p-8">
          <div className="md:col-span-9 text-slate-300 text-sm leading-relaxed border-r border-slate-800 md:pr-8">
            Every application state transition, inspection reading, security seal application, and certificate generation event is recorded in an append-only cryptographic ledger linked by SHA-256 hash chaining. Anyone can verify certificate authenticity publicly without login.
          </div>
          <div className="md:col-span-3 font-mono text-right">
            <span className="text-5xl font-extrabold text-blue-500/40">06</span>
            <h3 className="text-xl font-bold text-white mt-1">TRUST</h3>
            <span className="text-xs text-slate-400 block mt-1">SHA-256 Append-Only Ledger</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: QUICK SYSTEM ACTIONS */}
      <section className="bg-[#0f172a] border border-slate-800 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="font-mono text-xs text-blue-400 font-bold uppercase tracking-widest">[SYSTEM PORTALS]</span>
            <h3 className="font-display text-xl font-bold text-white mt-1">Operational Workstations</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate("applicant")}
            className="p-5 bg-[#080c14] hover:bg-[#0d1424] border border-slate-800 hover:border-blue-600/50 text-left transition group space-y-3"
          >
            <div className="w-8 h-8 bg-blue-950 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
            <div className="font-bold text-white text-base">Applicant Portal</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register weighing instruments, calculate statutory verification fees, track application progress.
            </p>
          </button>

          <button
            onClick={() => onNavigate("inspector")}
            className="p-5 bg-[#080c14] hover:bg-[#0d1424] border border-slate-800 hover:border-blue-600/50 text-left transition group space-y-3"
          >
            <div className="w-8 h-8 bg-blue-950 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
            <div className="font-bold text-white text-base">Inspector Workstation</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Field inspection runner, automated MPE tolerance checks, seal recordation, certificate generation.
            </p>
          </button>

          <button
            onClick={() => onNavigate("high_capacity")}
            className="p-5 bg-[#080c14] hover:bg-[#0d1424] border border-slate-800 hover:border-blue-600/50 text-left transition group space-y-3"
          >
            <div className="w-8 h-8 bg-blue-950 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              03
            </div>
            <div className="font-bold text-white text-base">Weighbridge 2026 Engine</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              July 2026 4th Amendment weighbridge standard weight substitution evaluator (1/2, 1/3, 1/5 Max).
            </p>
          </button>

          <button
            onClick={() => onNavigate("audit")}
            className="p-5 bg-[#080c14] hover:bg-[#0d1424] border border-slate-800 hover:border-blue-600/50 text-left transition group space-y-3"
          >
            <div className="w-8 h-8 bg-blue-950 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
              04
            </div>
            <div className="font-bold text-white text-base">Audit Ledger</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographic SHA-256 hash chain inspector for immutable forensic event verification.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
