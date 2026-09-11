import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState, EmptyState } from '../components/ui/States'
import { getApplications } from '../api'
import type { Application } from '../types'
import { format } from 'date-fns'
import {
  Database,
  Search,
  Filter,
  Download,
  ExternalLink,
  Award,
  Scale,
  ShieldCheck,
  Calendar,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Repository() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search & Filter filters
  const [searchQuery, setSearchQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [authorityFilter, setAuthorityFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    getApplications()
      .then(setApplications)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout role="officer"><LoadingPage /></Layout>
  if (error) return <Layout role="officer"><ErrorState message={error} /></Layout>

  const filtered = applications.filter(app => {
    // District filter
    if (districtFilter !== 'ALL' && (app.district || 'Pune') !== districtFilter) return false
    // Authority filter (LMO vs GATC)
    if (authorityFilter !== 'ALL' && (app.allocated_to_type || 'LMO') !== authorityFilter) return false
    // Instrument type filter
    if (typeFilter !== 'ALL' && app.instrument?.type !== typeFilter) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchId = app.application_id.toLowerCase().includes(q)
      const matchCert = (app.certificate?.certificate_id || '').toLowerCase().includes(q)
      const matchSeal = (app.certificate?.stamping_seal_no || '').toLowerCase().includes(q)
      const matchBiz = (app.instrument?.business_name || '').toLowerCase().includes(q)
      const matchSerial = (app.instrument?.serial_number || '').toLowerCase().includes(q)
      const matchOwner = (app.instrument?.owner_name || '').toLowerCase().includes(q)
      return matchId || matchCert || matchSeal || matchBiz || matchSerial || matchOwner
    }

    return true
  })

  const instrumentTypes = Array.from(new Set(applications.map(a => a.instrument?.type).filter(Boolean)))

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Certificate ID,Application ID,Stamping Seal,Instrument,Serial Number,Owner,Business,District,Status,Valid Until"].join(",") + "\n"
      + filtered.map(a => [
        a.certificate?.certificate_id || 'N/A',
        a.application_id,
        a.certificate?.stamping_seal_no || 'N/A',
        `"${a.instrument?.type || ''}"`,
        a.instrument?.serial_number || '',
        `"${a.instrument?.owner_name || ''}"`,
        `"${a.instrument?.business_name || ''}"`,
        a.district || 'Pune',
        a.status,
        a.certificate?.valid_until ? a.certificate.valid_until.slice(0,10) : 'N/A'
      ].join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Legal_Metrology_Central_Registry_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Central registry records exported to CSV")
  }

  return (
    <Layout
      role="officer"
      title="Central Legal Metrology Digital Records Repository"
      subtitle="Universal search &amp; retrieval vault for instruments, stamping seals, and verification certificates"
      actions={
        <button
          onClick={handleExportCSV}
          className="btn-primary text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Repository (CSV)
        </button>
      }
    >
      {/* Search & Filter Toolbar */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Universal Search by Certificate ID, Stamping Seal, Serial #, Business, or Trader..."
              className="input pl-10 text-sm font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => {
              setSearchQuery('')
              setDistrictFilter('ALL')
              setAuthorityFilter('ALL')
              setTypeFilter('ALL')
            }}
            className="btn-secondary text-xs"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Filter by District / Jurisdiction</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="input text-xs py-1.5"
            >
              <option value="ALL">All Maharashtra Districts</option>
              <option value="Pune">Pune District</option>
              <option value="Mumbai">Mumbai Metropolitan</option>
              <option value="Thane">Thane &amp; Raigad</option>
              <option value="Nashik">Nashik Region</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Testing &amp; Stamping Authority</label>
            <select
              value={authorityFilter}
              onChange={(e) => setAuthorityFilter(e.target.value)}
              className="input text-xs py-1.5"
            >
              <option value="ALL">All Authorities (LMO &amp; GATC)</option>
              <option value="LMO">State Legal Metrology Officers (LMO)</option>
              <option value="GATC">Govt Approved Test Centres (GATC)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Instrument Category</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input text-xs py-1.5"
            >
              <option value="ALL">All Instrument Types</option>
              {instrumentTypes.map(t => (
                <option key={t as string} value={t as string}>{t as string}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700">Digital Archive Index</span>
          <span className="text-xs text-slate-500">{filtered.length} Records Found</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No records matching search query"
            description="Try broadening your search term or resetting the filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Certificate / App Ref</th>
                  <th className="px-6 py-3.5">Stamping Seal #</th>
                  <th className="px-6 py-3.5">Instrument &amp; Serial</th>
                  <th className="px-6 py-3.5">Commercial Trader</th>
                  <th className="px-6 py-3.5">Authority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Quick Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      {app.certificate?.certificate_id ? (
                        <span className="font-mono font-bold text-emerald-700 block">
                          {app.certificate.certificate_id}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 block italic">Pending Issuance</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{app.application_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      {app.certificate?.stamping_seal_no ? (
                        <span className="font-mono font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {app.certificate.stamping_seal_no}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No seal applied</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{app.instrument?.type}</p>
                      <p className="text-[10px] font-mono text-slate-400">SN: {app.instrument?.serial_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{app.instrument?.business_name}</p>
                      <p className="text-[10px] text-slate-400">{app.district || 'Pune'} District</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        app.allocated_to_type === 'GATC'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}>
                        {app.allocated_to_type === 'GATC' ? 'GATC Lab' : 'State LMO'}
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
                          View Cert
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/officer/applications/${app.id}`)}
                          className="text-xs text-brand-600 hover:underline font-medium"
                        >
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
