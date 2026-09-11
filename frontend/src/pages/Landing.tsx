import { useNavigate } from 'react-router-dom'
import { Scale, Shield, Users, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 flex flex-col">
      {/* Top bar */}
      <header className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-500/20 rounded-xl border border-brand-400/30">
            <Scale className="h-6 w-6 text-brand-300" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">MetroVerify</p>
            <p className="text-white/40 text-xs">Ministry of Consumer Affairs · Maharashtra</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/verify')}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <Shield className="h-4 w-4" />
          Public Verify
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-400/30 text-brand-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Hackathon Prototype · Maharashtra Legal Metrology
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Digital Verification &amp;<br />
            <span className="text-brand-400">Compliance Platform</span>
          </h1>
          <p className="text-xl text-white/60 mb-4 max-w-2xl mx-auto leading-relaxed">
            End-to-end digitization of the Legal Metrology verification process for weighing and measuring instruments.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-14 text-sm text-white/50">
            {['Online Applications', 'Digital Inspection Reports', 'QR Certificates', 'Real-time Tracking'].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                {f}
              </span>
            ))}
          </div>

          {/* Role Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/business')}
              className="group bg-white/8 hover:bg-white/14 border border-white/15 rounded-2xl p-6 text-left transition-all duration-200 hover:border-brand-400/50 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-brand-500/20 border border-brand-400/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500/30 transition-colors">
                <Users className="h-5 w-5 text-brand-300" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Business Owner</h3>
              <p className="text-white/40 text-sm">Register instruments, submit applications, view certificates</p>
              <div className="mt-4 flex items-center gap-1 text-brand-400 text-xs font-medium">
                Enter Portal <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            <button
              onClick={() => navigate('/officer')}
              className="group bg-white/8 hover:bg-white/14 border border-white/15 rounded-2xl p-6 text-left transition-all duration-200 hover:border-violet-400/50 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-violet-500/20 border border-violet-400/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-500/30 transition-colors">
                <Shield className="h-5 w-5 text-violet-300" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Metrology Officer</h3>
              <p className="text-white/40 text-sm">Review applications, conduct inspections, issue certificates</p>
              <div className="mt-4 flex items-center gap-1 text-violet-400 text-xs font-medium">
                Enter Portal <ExternalLink className="h-3 w-3" />
              </div>
            </button>

            <button
              onClick={() => navigate('/verify')}
              className="group bg-white/8 hover:bg-white/14 border border-white/15 rounded-2xl p-6 text-left transition-all duration-200 hover:border-green-400/50 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
                <Scale className="h-5 w-5 text-green-300" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">Public Verification</h3>
              <p className="text-white/40 text-sm">Verify instrument certification status via certificate ID or QR code</p>
              <div className="mt-4 flex items-center gap-1 text-green-400 text-xs font-medium">
                Verify Now <ExternalLink className="h-3 w-3" />
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-white/25 text-xs">
        MetroVerify — Hackathon Prototype · Not for official use
      </footer>
    </div>
  )
}
