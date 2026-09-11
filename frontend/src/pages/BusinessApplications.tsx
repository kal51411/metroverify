import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState, EmptyState } from '../components/ui/States'
import { getApplications } from '../api'
import type { Application } from '../types'
import { format } from 'date-fns'
import { PlusCircle, Award, Eye, FileCheck } from 'lucide-react'

export default function BusinessApplications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout role="business"><LoadingPage /></Layout>
  if (error) return <Layout role="business"><ErrorState message={error} /></Layout>

  return (
    <Layout
      role="business"
      title="My Applications & Instruments"
      subtitle="Track the status of your verification applications and certificates"
      actions={
        <button className="btn-primary" onClick={() => navigate('/business/register')}>
          <PlusCircle className="h-4 w-4" />
          Register Instrument
        </button>
      }
    >
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Registered Applications</h2>
          <span className="text-xs text-slate-500">{applications.length} Total</span>
        </div>

        {applications.length === 0 ? (
          <EmptyState title="No applications found" description="Register an instrument to initiate verification." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Application ID</th>
                  <th className="px-6 py-3.5">Instrument & Serial</th>
                  <th className="px-6 py-3.5">Capacity</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Inspection / Center</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-brand-700">
                      {app.application_id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{app.instrument?.type}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">SN: {app.instrument?.serial_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {app.instrument?.capacity} {app.instrument?.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(app.submitted_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {app.inspection_date ? (
                        <div>
                          <p className="font-medium text-slate-800">{app.inspection_date} {app.inspection_time ? `@ ${app.inspection_time}` : ''}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">{app.test_centre || 'Assigned Center'}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not scheduled yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.status === 'VERIFIED' ? (
                        <button
                          onClick={() => navigate(`/certificate/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium rounded-lg transition-colors border border-green-200"
                        >
                          <Award className="h-3.5 w-3.5" />
                          Certificate
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/officer/applications/${app.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
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
