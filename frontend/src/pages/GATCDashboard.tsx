import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { KPICard } from '../components/ui/KPICard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState, EmptyState } from '../components/ui/States'
import { getApplications } from '../api'
import type { Application } from '../types'
import { format } from 'date-fns'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Scale,
  Award
} from 'lucide-react'

export default function GATCDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getApplications({ allocated_to_type: 'GATC' })
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout role="gatc"><LoadingPage /></Layout>
  if (error) return <Layout role="gatc"><ErrorState message={error} /></Layout>

  const pendingQueue = applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'UNDER_INSPECTION'].includes(a.status))
  const completed = applications.filter(a => a.status === 'VERIFIED')

  return (
    <Layout
      role="gatc"
      title="Government Approved Test Centre (GATC) Portal"
      subtitle="Accreditation: GATC Notification No. LM/GATC-2024/MH-04 · Section 24 of Legal Metrology Act"
    >
      {/* Accreditation Banner */}
      <div className="card p-5 mb-7 bg-gradient-to-r from-teal-900 to-slate-900 text-white border-0 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-xl">
              <Building2 className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">National Test House &amp; Metrology Calibration Lab</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-400 text-teal-950 font-bold uppercase">
                  Notified GATC #04
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Authorized for testing Non-automatic Weighing Instruments (NAWI) &amp; Storage Tanks across Western Maharashtra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <span className="text-[10px] uppercase text-white/50 block font-bold">Testing Queue</span>
              <span className="text-xl font-bold text-white">{pendingQueue.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <span className="text-[10px] uppercase text-white/50 block font-bold">Certified This Year</span>
              <span className="text-xl font-bold text-teal-400">{completed.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Allocation Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Instruments Allocated to GATC for Verification</h3>
            <p className="text-xs text-slate-400">Allocated under Section 24 delegation for statutory calibration &amp; stamping</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{applications.length} Total Allocated</span>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No instruments currently allocated"
            description="When applications are allocated to this GATC by State Metrology Officers, they will appear in this test queue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">App ID &amp; Type</th>
                  <th className="px-6 py-3.5">Commercial Establishment</th>
                  <th className="px-6 py-3.5">Instrument Specs</th>
                  <th className="px-6 py-3.5">District / Premises</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">GATC Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-brand-700">{app.application_id}</span>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">
                        {app.application_type === 'RE_VERIFICATION' ? 'Re-verification' : 'Initial Stamping'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{app.instrument?.business_name}</p>
                      <p className="text-xs text-slate-400">{app.instrument?.owner_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-800">{app.instrument?.type}</p>
                      <p className="text-xs font-mono text-slate-400">
                        SN: {app.instrument?.serial_number} ({app.instrument?.capacity} {app.instrument?.unit})
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {app.district || 'Pune'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {['SCHEDULED', 'UNDER_INSPECTION'].includes(app.status) && (
                        <button
                          onClick={() => navigate(`/officer/inspection/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium rounded-lg shadow-sm transition-colors"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          Perform Calibration
                        </button>
                      )}
                      {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(app.status) && (
                        <button
                          onClick={() => navigate(`/officer/applications/${app.id}`)}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          Review Specs
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      )}
                      {app.status === 'VERIFIED' && (
                        <button
                          onClick={() => navigate(`/certificate/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg border border-emerald-200 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          View Certificate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
