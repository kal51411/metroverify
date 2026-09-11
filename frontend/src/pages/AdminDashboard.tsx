import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { KPICard } from '../components/ui/KPICard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState } from '../components/ui/States'
import { getAdminStats, getApplications } from '../api'
import type { AdminEnforcementStats, Application } from '../types'
import {
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  BarChart3,
  MapPin,
  FileCheck2,
  Award
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminEnforcementStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('ALL')

  useEffect(() => {
    Promise.all([getAdminStats(), getApplications()])
      .then(([adminData, apps]) => {
        setStats(adminData)
        setApplications(apps)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout role="admin"><LoadingPage /></Layout>
  if (error || !stats) return <Layout role="admin"><ErrorState message={error || 'Failed to load controller data'} /></Layout>

  const chartData = stats.district_breakdown.map(d => ({
    district: d.district,
    Verified: d.verified,
    Pending: d.pending,
    Total: d.total_applications,
  }))

  const filteredApps = selectedDistrict === 'ALL'
    ? applications
    : applications.filter(a => (a.district || 'Pune') === selectedDistrict)

  const handleExportSummary = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Application ID,Business,Type,District,Status,Allocated To,Stamping Seal"].join(",") + "\n"
      + filteredApps.map(a => [
        a.application_id,
        `"${a.instrument?.business_name || ''}"`,
        a.instrument?.type,
        a.district || 'Pune',
        a.status,
        a.allocated_to_type || 'LMO',
        a.certificate?.stamping_seal_no || 'N/A'
      ].join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Legal_Metrology_Enforcement_Report_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Enforcement summary report exported as CSV")
  }

  return (
    <Layout
      role="admin"
      title="State Legal Metrology Controller &amp; Enforcement Dashboard"
      subtitle="Jurisdiction: Maharashtra State Legal Metrology Headquarters, Mumbai"
      actions={
        <button
          onClick={handleExportSummary}
          className="btn-primary text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Enforcement Audit (CSV)
        </button>
      }
    >
      {/* Top Controller KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <KPICard
          title="Statewide Stamped Instruments"
          value={stats.total_stamped_active}
          subtitle="Compliant under Rule 24"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KPICard
          title="Overall Compliance Rate"
          value={`${stats.compliance_rate_percent}%`}
          subtitle="Verification vs Applications"
          icon={BarChart3}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <KPICard
          title="Overdue Re-verifications"
          value={stats.overdue_reverifications}
          subtitle="Pending Rule 27 Stamping"
          icon={ShieldAlert}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <KPICard
          title="Active Testing Infrastructure"
          value={`${stats.lmo_officers_active} LMOs / ${stats.gatc_centers_active} GATCs`}
          subtitle="Notified Govt Approved Centres"
          icon={Building2}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* District Pendency & Verification Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">District-wise Verification &amp; Pendency Breakdown</h3>
              <p className="text-xs text-slate-400">Comparing compliant verified devices vs pending backlog by jurisdiction</p>
            </div>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
              Real-time Sync
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Verified" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Pendency Summary Card */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Jurisdiction Pendency Matrix
            </h3>
            <p className="text-xs text-slate-400 mb-4">Compliance percentage under Legal Metrology Act</p>

            <div className="space-y-3">
              {stats.district_breakdown.map((d) => (
                <div key={d.district} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 block">{d.district}</span>
                    <span className="text-[10px] text-slate-400">Total: {d.total_applications} | Pending: {d.pending}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {d.compliance_rate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-500">
            Mandatory Annual Stamping enforcement reports generated per Rule 27 guidelines.
          </div>
        </div>
      </div>

      {/* Applications Table with District Filter */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Filter by Jurisdiction District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Maharashtra Districts</option>
              <option value="Pune">Pune District</option>
              <option value="Mumbai">Mumbai Metropolitan</option>
              <option value="Thane">Thane &amp; Raigad</option>
              <option value="Nashik">Nashik Region</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">Showing {filteredApps.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Application ID</th>
                <th className="px-6 py-3.5">Commercial Establishment</th>
                <th className="px-6 py-3.5">Instrument &amp; Serial</th>
                <th className="px-6 py-3.5">District</th>
                <th className="px-6 py-3.5">Allocation</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Verification Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-brand-700">{app.application_id}</span>
                    <span className={`block text-[10px] uppercase font-semibold ${app.application_type === 'RE_VERIFICATION' ? 'text-violet-600' : 'text-slate-400'}`}>
                      {app.application_type === 'RE_VERIFICATION' ? 'Rule 27 Re-verif.' : 'Initial Verif.'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{app.instrument?.business_name}</p>
                    <p className="text-xs text-slate-400">{app.instrument?.owner_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-800">{app.instrument?.type}</p>
                    <p className="text-xs font-mono text-slate-400">SN: {app.instrument?.serial_number}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {app.district || 'Pune'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      app.allocated_to_type === 'GATC'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-violet-50 text-violet-700 border border-violet-200'
                    }`}>
                      {app.allocated_to_type === 'GATC' ? 'GATC Notified Lab' : 'State LMO Officer'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'VERIFIED' ? (
                      <button
                        onClick={() => navigate(`/certificate/${app.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Certificate
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/officer/applications/${app.id}`)}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Audit Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
