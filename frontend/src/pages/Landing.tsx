import { useNavigate } from 'react-router-dom'
import {
  Scale,
  Shield,
  Users,
  ExternalLink,
  CheckCircle2,
  Building2,
  BarChart3,
  Database,
  Code2,
  QrCode,
  FileCheck2
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-brand-950 flex flex-col">
      {/* Top bar */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-500/20 rounded-xl border border-brand-400/30">
            <Scale className="h-6 w-6 text-brand-300" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">MetroVerify</p>
            <p className="text-white/50 text-xs">Department of Legal Metrology · Govt of Maharashtra</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/architecture')}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium transition-colors"
          >
            <Code2 className="h-4 w-4" />
            Architecture &amp; Docs
          </button>
          <button
            onClick={() => navigate('/verify')}
            className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            <QrCode className="h-3.5 w-3.5" />
            Public QR Verify
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-400/30 text-brand-300 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Unified Legal Metrology Digital Verification &amp; Certification Platform · Rule 27 &amp; Sec 24
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
            Digital Verification &amp; Lifecycle Management<br />
            <span className="text-brand-400">for Weighing &amp; Measuring Instruments</span>
          </h1>
          <p className="text-base md:text-lg text-white/65 mb-6 max-w-3xl mx-auto leading-relaxed">
            Statutory compliance platform uniting <strong>Traders</strong>, <strong>State LMOs</strong>, <strong>Government Approved Test Centres (GATCs)</strong>, and <strong>Regulators</strong> under the Legal Metrology Act, 2009.
          </p>

          {/* Compliance Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 text-xs text-white/60">
            {[
              'Online Verification & Re-verification',
              'LMO & GATC Test Allocation',
              'Digital Lead Seal Stamping',
              'QR Cryptographic Certificates',
              'Field Mobile Inspection Support',
              'Centralized State Registry'
            ].map(f => (
              <span key={f} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {f}
              </span>
            ))}
          </div>

          {/* 5 Role Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-left mb-8">
            {/* 1. Business Owner */}
            <button
              onClick={() => navigate('/business')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-400/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-brand-500/20 border border-brand-400/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-brand-500/30">
                  <Users className="h-5 w-5 text-brand-300" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">Commercial Trader</h3>
                <p className="text-white/50 text-xs leading-snug">
                  Register instruments, apply for Rule 27 periodic re-verification, view digital certificates.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-brand-400 text-xs font-semibold">
                Trader Portal <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            {/* 2. Legal Metrology Officer */}
            <button
              onClick={() => navigate('/officer')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-400/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-violet-500/20 border border-violet-400/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-violet-500/30">
                  <Shield className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">State LMO Officer</h3>
                <p className="text-white/50 text-xs leading-snug">
                  Review applications, allocate to GATCs, execute mobile digital field inspections &amp; stamping.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-violet-400 text-xs font-semibold">
                Officer Hub <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            {/* 3. GATC Test Centre */}
            <button
              onClick={() => navigate('/gatc')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-teal-500/20 border border-teal-400/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-500/30">
                  <Building2 className="h-5 w-5 text-teal-300" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">GATC Test Centre</h3>
                <p className="text-white/50 text-xs leading-snug">
                  Govt Approved Test Centres notified under Sec 24 to perform statutory testing &amp; calibration.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-teal-400 text-xs font-semibold">
                GATC Portal <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            {/* 4. State Controller / Enforcement Admin */}
            <button
              onClick={() => navigate('/admin')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-400/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-rose-500/20 border border-rose-400/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-500/30">
                  <BarChart3 className="h-5 w-5 text-rose-300" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">State Controller</h3>
                <p className="text-white/50 text-xs leading-snug">
                  Monitor jurisdiction pendency, statewide compliance rates, overdue re-verifications &amp; audit trails.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-rose-400 text-xs font-semibold">
                Enforcement <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            {/* 5. Public Consumer Verification */}
            <button
              onClick={() => navigate('/verify')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-500/30">
                  <Scale className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1">Public Verification</h3>
                <p className="text-white/50 text-xs leading-snug">
                  Instant zero-auth transparency check: verify certificate authenticity, validity, and lead seals.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                Verify Now <ExternalLink className="h-3 w-3" />
              </div>
            </button>
          </div>

          {/* Quick Hub Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 pt-4 border-t border-white/10">
            <button onClick={() => navigate('/repository')} className="hover:text-brand-300 flex items-center gap-1.5 transition-colors">
              <Database className="w-3.5 h-3.5" />
              Central Records Registry
            </button>
            <span>·</span>
            <button onClick={() => navigate('/architecture')} className="hover:text-brand-300 flex items-center gap-1.5 transition-colors">
              <Code2 className="w-3.5 h-3.5" />
              Security Architecture &amp; Legal Framework
            </button>
            <span>·</span>
            <button onClick={() => navigate('/verify/LM-CERT-2026-001')} className="hover:text-brand-300 flex items-center gap-1.5 transition-colors">
              <FileCheck2 className="w-3.5 h-3.5" />
              Sample Pre-Verified Certificate
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-white/30 text-xs border-t border-white/10">
        Legal Metrology Verification Platform · Government of Maharashtra · Hackathon Prototype Demonstration
      </footer>
    </div>
  )
}
