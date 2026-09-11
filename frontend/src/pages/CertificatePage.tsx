import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getApplication, getCertificatePdfUrl } from '../api'
import type { Application } from '../types'
import { format } from 'date-fns'
import {
  Download,
  ShieldCheck,
  Award,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Printer,
  Scale,
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      getApplication(parseInt(id))
        .then(setApp)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 font-semibold mb-3">{error || 'Certificate not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary text-xs">Go Back</button>
      </div>
    )
  }

  // Derive certificate details or fallback
  const certId = app.certificate?.certificate_id || `LM-CERT-2026-${String(app.id).padStart(3, '0')}`
  const verifyUrl = `${window.location.origin}/verify/${certId}`
  const pdfDownloadUrl = app.certificate ? getCertificatePdfUrl(app.certificate.id) : '#'

  const handleDownload = () => {
    if (app.certificate?.id) {
      window.open(getCertificatePdfUrl(app.certificate.id), '_blank')
    } else {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      {/* Top Action Bar */}
      <div className="w-full max-w-3xl mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Certificate PDF
          </button>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="w-full max-w-3xl bg-white border-2 border-slate-300 shadow-xl rounded-2xl p-8 md:p-12 relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
          <Scale className="w-[500px] h-[500px] text-slate-900" />
        </div>

        {/* Top Emblem & Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 text-white rounded-xl mb-3 shadow-md">
            <Scale className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-0.5">Government of Maharashtra</p>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">
            Department of Legal Metrology (Weights &amp; Measures)
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-navy-900 tracking-tight">
            LEGAL METROLOGY VERIFICATION CERTIFICATE
          </h1>
          <p className="text-xs text-brand-700 font-semibold mt-1">
            Issued under the Legal Metrology Act, 2009 &amp; Maharashtra Rules
          </p>
        </div>

        {/* Certificate Reference Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
              Certificate Identification Number
            </span>
            <span className="font-mono font-bold text-lg text-brand-800">{certId}</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wide">VERIFIED ✓ PASS</span>
          </div>
        </div>

        {/* Certificate Data Sections */}
        <div className="space-y-6 text-sm mb-8">
          {/* Instrument Specs */}
          <div>
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-600" />
              1. Instrument Particulars
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Instrument Type</span>
                <span className="font-semibold text-slate-800">{app.instrument?.type}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Manufacturer</span>
                <span className="font-semibold text-slate-800">{app.instrument?.manufacturer}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Model</span>
                <span className="font-semibold text-slate-800">{app.instrument?.model}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Serial Number</span>
                <span className="font-mono font-bold text-brand-700">{app.instrument?.serial_number}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Max Capacity / Range</span>
                <span className="font-semibold text-slate-800">{app.instrument?.capacity} {app.instrument?.unit}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Unique System ID</span>
                <span className="font-mono text-xs text-slate-600">{app.instrument?.instrument_id}</span>
              </div>
            </div>
          </div>

          {/* Business / Custodian */}
          <div>
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              2. Commercial Establishment &amp; Custodian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Registered Entity</span>
                <span className="font-semibold text-slate-800">{app.instrument?.business_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Authorized Owner / Trader</span>
                <span className="font-semibold text-slate-800">{app.instrument?.owner_name}</span>
              </div>
              <div className="col-span-full">
                <span className="text-xs text-slate-400 block">Physical Premises Address</span>
                <span className="text-slate-700">{app.instrument?.address}</span>
              </div>
            </div>
          </div>

          {/* Calibration & Expiry Validity */}
          <div>
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-violet-600" />
              3. Verification Dates &amp; Compliance Validity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Verification Date</span>
                <span className="font-semibold text-slate-800">
                  {app.certificate?.verification_date
                    ? format(new Date(app.certificate.verification_date), 'dd MMM yyyy')
                    : format(new Date(), 'dd MMM yyyy')}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Valid Until</span>
                <span className="font-bold text-emerald-700">
                  {app.certificate?.valid_until
                    ? format(new Date(app.certificate.valid_until), 'dd MMM yyyy')
                    : format(new Date(Date.now() + 365 * 86400000), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block">Standard Permissible Tolerance</span>
                <span className="font-medium text-slate-800">Within ±0.50% Maximum Error</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: QR Code & Signatures */}
        <div className="pt-6 border-t-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* QR Code Container */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <QRCodeSVG value={verifyUrl} size={84} level="H" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Scan for Public Verification</span>
              <p className="text-[11px] text-slate-500 max-w-[190px] leading-tight mt-0.5">
                Scan using camera to verify digital authenticity &amp; current validity.
              </p>
              <button
                onClick={() => navigate(`/verify/${certId}`)}
                className="text-[11px] text-brand-600 font-semibold hover:underline inline-flex items-center gap-1 mt-1.5"
              >
                Open Verify Page <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Officer Stamp & Signoff */}
          <div className="text-center md:text-right">
            <div className="inline-block border-b-2 border-slate-400 pb-1 mb-1.5 w-48 text-center">
              <span className="font-serif italic font-semibold text-brand-800">Kavitha Nair</span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              {app.assigned_officer || 'Smt. Kavitha Nair'}
            </p>
            <p className="text-[11px] text-slate-500">Legal Metrology Inspector, Grade-I</p>
            <p className="text-[10px] text-slate-400">{app.test_centre || 'Government Verification Laboratory, Pune'}</p>
          </div>
        </div>

        {/* Disclaimer footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          MetroVerify Demonstration System · Digitally verified under Legal Metrology Automated Portal
        </div>
      </div>
    </div>
  )
}
