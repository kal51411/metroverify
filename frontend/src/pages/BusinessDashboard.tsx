import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, Clock, TrendingUp, AlertTriangle, PlusCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Layout } from '../components/layout/Layout'
import { KPICard } from '../components/ui/KPICard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState } from '../components/ui/States'
import { getApplications, getBusinessStats } from '../api'
import type { Application, BusinessStats } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#3b82f6',
  UNDER_REVIEW: '#f59e0b',
  SCHEDULED: '#8b5cf6',
  UNDER_INSPECTION: '#f97316',
  VERIFIED: '#16a34a',
  FAILED: '#dc2626',
}

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getApplications(), getBusinessStats()])
      .then(([apps, s]) => {
        setApplications(apps)
        setStats(s)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout role="business"><LoadingPage /></Layout>
  if (error) return <Layout role="business"><ErrorState message={error} /></Layout>

  // Chart data
  const statusGroups: Record<string, number> = {}
  applications.forEach(a => {
    statusGroups[a.status] = (statusGroups[a.status] || 0) + 1
  })
  const chartData = Object.entries(statusGroups).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
    fill: STATUS_COLORS[status] || '#94a3b8',
  }))

  const verifiedCount = applications.filter(a => a.status === 'VERIFIED').length
  const failedCount = applications.filter(a => a.status === 'FAILED').length
  const pieData = [
    { name: 'PASS', value: verifiedCount, color: '#16a34a' },
    { name: 'FAIL', value: failedCount, color: '#dc2626' },
  ].filter(d => d.value > 0)

  return (
    <Layout
      role="business"
      title="Business Dashboard"
      subtitle="Overview of your instruments and verification applications"
      actions={
        <button className="btn-primary" onClick={() => navigate('/business/register')}>
          <PlusCircle className="h-4 w-4" />
          Register Instrument
        </button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <KPICard title="Total Instruments" value={stats?.total_instruments ?? 0} icon={TrendingUp} iconColor="text-brand-600" iconBg="bg-brand-50" />
        <KPICard title="Applications" value={stats?.total_applications ?? 0} icon={FileText} iconColor="text-violet-600" iconBg="bg-violet-50" />
        <KPICard title="Under Verification" value={stats?.under_verification ?? 0} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KPICard title="Verified" value={stats?.verified ?? 0} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <KPICard title="Expiring Soon" value={stats?.expiring_soon ?? 0} icon={AlertTriangle} iconColor="text-orange-600" iconBg="bg-orange-50" />
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Applications by Status</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Applications']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Pass / Fail Results</h3>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm text-slate-400">No completed inspections yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Applications</h3>
          <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate('/business/applications')}>View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Application ID</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Instrument</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Serial No.</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.slice(0, 8).map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-brand-700">{app.application_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{app.instrument?.type ?? '—'}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{app.instrument?.serial_number ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(app.submitted_at), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4">
                    <button
                      className="text-xs text-brand-600 hover:underline font-medium"
                      onClick={() => {
                        if (app.status === 'VERIFIED' || app.status === 'FAILED') {
                          navigate(`/business/applications`)
                        } else {
                          navigate(`/business/applications`)
                        }
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No applications yet. Register your first instrument to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
