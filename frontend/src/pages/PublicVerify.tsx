import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { verifyCertificate } from '../api'
import type { VerifyResponse } from '../types'
import { format } from 'date-fns'
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Calendar,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

export default function PublicVerify() {
  const { certificateId } = useParams<{ certificateId?: string }>()
  const navigate = useNavigate()

  const [inputCertId, setInputCertId] = useState(certificateId || '')
  const [data, setData] = useState<VerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (certificateId) {
      handleLookup(certificateId)
    }
  }, [certificateId])

  const handleLookup = async (idToSearch: string) => {
    const cleanId = idToSearch.trim()
    if (!cleanId) return

    setLoading(true)
    setError('')
    setData(null)
    setSearched(true)

    try {
      const res = await verifyCertificate(cleanId)
      setData(res)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No verified certificate found for this identifier.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCertId) {
      navigate(`/verify/${inputCertId.trim()}`)
      handleLookup(inputCertId)
    }
  }

  // Pre-fill quick demo queries
  const sampleCertificates = [
    'LM-CERT-2026-001',
    'LM-CERT-2026-002',
    'LM-CERT-2026-003',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 bg-brand-600 rounded-xl">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">MetroVerify</p>
            <p className="text-white/40 text-[10px]">Public Trust &amp; Verification Portal</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </button>
      </header>

      {/* Hero / Search Section */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-300 mb-4 border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Legal Metrology Authenticity Check
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Verify Instrument Certificate
          </h1>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Instantly check legal verification status, tamper-proof calibration logs, and expiry dates of commercial measuring devices.
          </p>
        </div>

        {/* Certificate Lookup Input */}
        <form onSubmit={handleSubmit} className="w-full mb-6">
          <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-1.5 focus-within:border-brand-400">
            <input
              type="text"
              value={inputCertId}
              onChange={(e) => setInputCertId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. LM-CERT-2026-001)"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 px-6 text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        </form>

        {/* Quick Demo Fillers */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs text-white/40">
          <span>Quick Demo Sample:</span>
          {sampleCertificates.map(id => (
            <button
              key={id}
              onClick={() => {
                setInputCertId(id)
                navigate(`/verify/${id}`)
                handleLookup(id)
              }}
              className="underline hover:text-brand-300 font-mono text-white/70"
            >
              {id}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-400 mx-auto mb-3" />
            <p className="text-xs text-white/50">Querying central metrology verification registry...</p>
          </div>
        )}

        {/* Error / Not Found Card */}
        {error && !loading && (
          <div className="w-full card bg-rose-950/40 border-rose-800/60 p-6 rounded-2xl text-center backdrop-blur-sm animate-fade-in">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-rose-200">AUTHENTICITY CHECK FAILED</h2>
            <p className="text-xs text-rose-300/80 mt-1 max-w-sm mx-auto">{error}</p>
            <p className="text-[11px] text-white/40 mt-4">
              Please inspect the physical seal on the instrument or report non-compliance to the Metrology Department.
            </p>
          </div>
        )}

        {/* Result Card */}
        {data && !loading && (
          <div className="w-full space-y-4 animate-fade-in">
            {/* Status Header Banner */}
            <div className={`card p-6 rounded-2xl border-2 text-white ${
              data.is_valid
                ? 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-emerald-500/80'
                : 'bg-gradient-to-r from-rose-900/90 to-red-900/90 border-rose-500/80'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    data.is_valid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {data.is_valid ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">
                      {data.is_valid ? 'AUTHENTIC & CURRENTLY VALID' : 'INVALID / EXPIRED CERTIFICATE'}
                    </h2>
                    <p className="text-xs text-white/75 mt-0.5">
                      Certificate Reference: <span className="font-mono font-bold text-white">{data.certificate_id}</span>
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    data.is_valid ? 'bg-white text-emerald-900' : 'bg-white text-rose-900'
                  }`}>
                    {data.status_label}
                  </span>
                </div>
              </div>

              {/* Trust Indicators Pill Row */}
              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="flex items-center justify-center gap-1.5 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Found in Registry</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Matches Serial No.</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-white/90">
                  {data.is_valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Valid Calibration</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Expired Validity</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Instrument & Owner Details Table */}
            <div className="card bg-slate-900/80 border-white/10 p-6 rounded-2xl text-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Verified Instrument Specification
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Instrument Type</span>
                  <span className="font-semibold text-white text-sm">{data.instrument_type}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Manufacturer &amp; Model</span>
                  <span className="font-semibold text-white text-sm">{data.manufacturer} {data.model}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Serial Number</span>
                  <span className="font-mono font-bold text-brand-300 text-sm">{data.serial_number}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Instrument System ID</span>
                  <span className="font-mono text-white/80">{data.instrument_id}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Commercial Entity / Business</span>
                  <span className="font-semibold text-white text-sm">{data.business_name}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Registered Owner</span>
                  <span className="font-semibold text-white">{data.owner_name}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Verification Date</span>
                  <span className="font-medium text-white">{format(new Date(data.verification_date), 'dd MMMM yyyy')}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 block">Valid Until</span>
                  <span className={`font-bold ${data.is_valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {format(new Date(data.valid_until), 'dd MMMM yyyy')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                <span>Inspecting Officer: {data.officer}</span>
                <span>Lab: {data.test_centre}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-white/10 text-[11px] text-white/30">
        Maharashtra State Legal Metrology Department · MetroVerify Hackathon Prototype
      </footer>
    </div>
  )
}
