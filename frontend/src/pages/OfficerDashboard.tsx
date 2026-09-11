import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { KPICard } from '../components/ui/KPICard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState, EmptyState } from '../components/ui/States'
import { getApplications, getOfficerStats } from '../api'
import type { Application, OfficerStats } from '../types'
import { format } from 'date-fns'
import {
  Clock,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react'

type FilterType = 'ALL' | 'PENDING' | 'SCHEDULED' | 'INSPECTION' | 'VERIFIED' | 'FAILED'

export default function OfficerDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<OfficerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([getApplications(), getOfficerStats()])
      .then(([apps, st]) => {
        setApplications(apps)
        setStats(st)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading) return <Layout role="officer"><LoadingPage /></Layout>
  if (error) return <Layout role="officer"><ErrorState message={error} /></Layout>

  const filteredApps = applications.filter(app => {
    // Filter matching
    if (activeFilter === 'PENDING' && !['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(app.status)) return false
    if (activeFilter === 'SCHEDULED' && app.status !== 'SCHEDULED') return false
    if (activeFilter === 'INSPECTION' && app.status !== 'UNDER_INSPECTION') return false
    if (activeFilter === 'VERIFIED' && app.status !== 'VERIFIED') return false
    if (activeFilter === 'FAILED' && app.status !== 'FAILED') return false

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchId = app.application_id.toLowerCase().includes(q)
      const matchBiz = (app.instrument?.business_name || '').toLowerCase().includes(q)
      const matchType = (app.instrument?.type || '').toLowerCase().includes(q)
      const matchSerial = (app.instrument?.serial_number || '').toLowerCase().includes(q)
      return matchId || matchBiz || matchType || matchSerial
    }

    return true
  })

  return (
    <Layout
      role="officer"
      title="Legal Metrology Officer Dashboard"
      subtitle="Jurisdiction: Maharashtra State Metrology Verification Cell"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-7">
        <KPICard
          title="Pending Review"
          value={stats?.pending ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KPICard
          title="Scheduled"
          value={stats?.scheduled ?? 0}
          icon={Calendar}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <KPICard
          title="In Inspection"
          value={stats?.under_inspection ?? 0}
          icon={Search}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <KPICard
          title="Verified (Pass)"
          value={stats?.verified ?? 0}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <KPICard
          title="Failed"
          value={stats?.failed ?? 0}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <KPICard
          title="Expiring Soon"
          value={stats?.expiring_soon ?? 0}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
      </div>

      {/* Main Table Card */}
      <div className="card overflow-hidden">
        {/* Controls bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending Review' },
              { id: 'SCHEDULED', label: 'Scheduled' },
              { id: 'INSPECTION', label: 'Inspection' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'FAILED', label: 'Failed' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === f.id
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID, business, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-1.5 text-xs w-full md:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Applications Table */}
        {filteredApps.length === 0 ? (
          <EmptyState
            title="No applications found"
            description="No applications match the current filter or search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">App ID</th>
                  <th className="px-6 py-3.5">Business & Applicant</th>
                  <th className="px-6 py-3.5">Instrument</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-brand-700">
                      {app.application_id}
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
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(app.submitted_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        app.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : app.priority === 'LOW'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {app.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(app.status) && (
                        <button
                          onClick={() => navigate(`/officer/applications/${app.id}`)}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Review
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      )}
                      {['SCHEDULED', 'UNDER_INSPECTION'].includes(app.status) && (
                        <button
                          onClick={() => navigate(`/officer/inspection/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 text-xs font-medium rounded-lg shadow-sm transition-colors"
                        >
                          Perform Inspection
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {app.status === 'VERIFIED' && (
                        <button
                          onClick={() => navigate(`/certificate/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium rounded-lg border border-green-200 transition-colors"
                        >
                          View Certificate
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {app.status === 'FAILED' && (
                        <button
                          onClick={() => navigate(`/officer/applications/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium rounded-lg border border-red-200 transition-colors"
                        >
                          Inspection Log
                          <ArrowRight className="w-3.5 h-3.5" />
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
