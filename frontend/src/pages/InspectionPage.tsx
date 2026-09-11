import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { LoadingPage, ErrorState } from '../components/ui/States'
import { getApplication, startInspection, completeInspection, generateCertificate } from '../api'
import type { Application } from '../types'
import toast from 'react-hot-toast'
import {
  Scale,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  ArrowLeft,
  Sliders,
  ShieldAlert,
  Info,
  MapPin,
  Stamp,
  Smartphone
} from 'lucide-react'

interface TestRow {
  id: string
  standard: number
  observed: number
}

export default function InspectionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [issuedCertLoading, setIssuedCertLoading] = useState(false)

  // Determine role from URL path (officer or gatc)
  const role = location.pathname.startsWith('/gatc') ? 'gatc' : 'officer'

  // Inspection state
  const [officerName, setOfficerName] = useState('Smt. Kavitha Nair (Legal Metrology Officer)')
  const [tolerance, setTolerance] = useState<number>(0.50) // +/- 0.50%

  // Field Evidence state (new)
  const [stampingSealNo, setStampingSealNo] = useState('')
  const [gpsLocation, setGpsLocation] = useState('18.5204° N, 73.8567° E (Pune Central)')
  const [isFieldInspection, setIsFieldInspection] = useState(false)

  // Default test measurement rows
  const [rows, setRows] = useState<TestRow[]>([
    { id: '1', standard: 10, observed: 10.02 },
    { id: '2', standard: 20, observed: 20.03 },
    { id: '3', standard: 30, observed: 30.04 },
  ])

  // Completed inspection result from backend or local eval
  const [completedResult, setCompletedResult] = useState<'PASS' | 'FAIL' | null>(null)

  useEffect(() => {
    if (id) {
      loadData(parseInt(id))
    }
  }, [id])

  const loadData = async (appId: number) => {
    setLoading(true)
    try {
      const application = await getApplication(appId)
      setApp(application)
      if (application.assigned_officer) {
        setOfficerName(application.assigned_officer)
      }
      // If status is SCHEDULED, mark as UNDER_INSPECTION
      if (application.status === 'SCHEDULED') {
        await startInspection(appId)
        application.status = 'UNDER_INSPECTION'
      }
      if (application.status === 'VERIFIED') {
        setCompletedResult('PASS')
      } else if (application.status === 'FAILED') {
        setCompletedResult('FAIL')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inspection details')
    } finally {
      setLoading(false)
    }
  }

  // Row operations
  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1]
    const nextStd = lastRow ? lastRow.standard + 10 : 10
    setRows([
      ...rows,
      { id: Date.now().toString(), standard: nextStd, observed: nextStd }
    ])
  }

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      toast.error('At least one calibration test row is required')
      return
    }
    setRows(rows.filter(r => r.id !== rowId))
  }

  const handleUpdateRow = (rowId: string, field: 'standard' | 'observed', value: number) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r))
  }

  // Deterministic automatic calculation
  const calculations = rows.map(r => {
    const std = Number(r.standard) || 0.0001
    const obs = Number(r.observed) || 0
    const err = obs - std
    const errPct = (err / std) * 100
    const isWithin = Math.abs(errPct) <= tolerance
    return {
      ...r,
      error: err,
      errorPct: errPct,
      isWithin,
    }
  })

  // Rule-based automatic pass / fail evaluation
  const allWithinTolerance = calculations.every(c => c.isWithin)
  const evaluatedResult = allWithinTolerance ? 'PASS' : 'FAIL'
  const maxErrorPct = Math.max(...calculations.map(c => Math.abs(c.errorPct)), 0)

  // Submit inspection to backend
  const handleSubmitInspection = async () => {
    if (!app) return
    setSubmitting(true)
    try {
      const payload = {
        officer: officerName,
        tolerance: tolerance,
        results: rows.map(r => ({
          standard_value: Number(r.standard),
          observed_value: Number(r.observed),
        })),
        stamping_seal_no: stampingSealNo || undefined,
        gps_location: isFieldInspection ? gpsLocation : undefined,
        is_field_inspection: isFieldInspection,
      }

      const res = await completeInspection(app.id, payload)
      setCompletedResult(res.result)
      setApp({ ...app, status: res.application_status })
      if (res.result === 'PASS') {
        toast.success('Inspection Completed: PASS! You can now issue the certificate.')
      } else {
        toast.error('Inspection Completed: FAILED tolerance test.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit inspection')
    } finally {
      setSubmitting(false)
    }
  }

  // Issue Certificate
  const handleIssueCertificate = async () => {
    if (!app) return
    setIssuedCertLoading(true)
    try {
      await generateCertificate(app.id)
      toast.success('Official Verification Certificate Generated!')
      navigate(`/certificate/${app.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to issue certificate')
    } finally {
      setIssuedCertLoading(false)
    }
  }

  if (loading) return <Layout role={role}><LoadingPage /></Layout>
  if (error || !app) return <Layout role={role}><ErrorState message={error || 'Inspection data missing'} /></Layout>

  return (
    <Layout
      role={role}
      title={`Digital Inspection Report: ${app.instrument?.type}`}
      subtitle={`Application: ${app.application_id} · Unit: ${app.instrument?.unit}`}
      actions={
        <button
          onClick={() => navigate(role === 'gatc' ? '/gatc' : `/officer/applications/${app.id}`)}
          className="btn-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Application
        </button>
      }
    >
      {/* Instrument Overview Banner */}
      <div className="card p-5 mb-6 bg-gradient-to-r from-slate-900 to-navy-900 text-white border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Scale className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{app.instrument?.type}</h2>
              <p className="text-xs text-white/60">
                {app.instrument?.manufacturer} {app.instrument?.model} · Serial #{app.instrument?.serial_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] text-white/50 block">Capacity</span>
              <span className="font-semibold text-sm">{app.instrument?.capacity} {app.instrument?.unit}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/50 block">Applicant</span>
              <span className="font-semibold text-sm">{app.instrument?.business_name}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/50 block">Test Lab</span>
              <span className="font-semibold text-sm">{app.test_centre || 'State Metrology Lab'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tolerance & Officer Config */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-brand-600" />
            <div>
              <label className="text-xs font-semibold text-slate-700 block">Legal Metrology Error Tolerance</label>
              <p className="text-xs text-slate-400">Permissible maximum percentage deviation as per Standards of Weights &amp; Measures</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-600 font-medium">± Allowed Tolerance:</span>
              <select
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
              >
                <option value={0.10}>± 0.10%</option>
                <option value={0.20}>± 0.20%</option>
                <option value={0.50}>± 0.50% (Standard)</option>
                <option value={1.00}>± 1.00%</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Inspector:</span>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="input py-1 text-xs w-60"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Field Evidence & Stamping Card */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Stamp className="w-5 h-5 text-violet-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Field Evidence & Stamping Particulars</h3>
            <p className="text-xs text-slate-400">Mandatory per Legal Metrology (General) Rules, 2011 — Rule 27</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFieldInspection(!isFieldInspection)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                isFieldInspection
                  ? 'bg-violet-100 text-violet-700 border-violet-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {isFieldInspection ? 'Field Inspection ON' : 'Field Inspection OFF'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Stamping Seal Number</label>
            <div className="relative">
              <Stamp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={stampingSealNo}
                onChange={(e) => setStampingSealNo(e.target.value)}
                placeholder="e.g. MH-SEAL-2026-PNE-001 (auto-generated if blank)"
                className="input pl-9 text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lead seal stamped on the instrument post-verification. Auto-assigned by system if left blank.</p>
          </div>
          <div>
            <label className="label">GPS Geotag Location {!isFieldInspection && <span className="text-slate-400 font-normal">(enable Field Inspection to record)</span>}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={gpsLocation}
                onChange={(e) => setGpsLocation(e.target.value)}
                disabled={!isFieldInspection}
                placeholder="18.5204° N, 73.8567° E"
                className="input pl-9 text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Latitude/longitude recorded at the inspection site for audit trail purposes.</p>
          </div>
        </div>
      </div>

      {/* Test Measurement Table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Observed vs Standard Value Calibration Matrix</h3>
            <p className="text-xs text-slate-500">System calculates deterministic error values in real-time</p>
          </div>
          <button
            type="button"
            onClick={handleAddRow}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Test Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Standard Value ({app.instrument?.unit})</th>
                <th className="px-6 py-3.5">Observed Value ({app.instrument?.unit})</th>
                <th className="px-6 py-3.5">Absolute Error</th>
                <th className="px-6 py-3.5">Error Percentage</th>
                <th className="px-6 py-3.5">Tolerance Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculations.map((calc, idx) => (
                <tr key={calc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.001"
                      value={calc.standard}
                      onChange={(e) => handleUpdateRow(calc.id, 'standard', parseFloat(e.target.value) || 0)}
                      className="input py-1 text-sm font-mono w-36"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.001"
                      value={calc.observed}
                      onChange={(e) => handleUpdateRow(calc.id, 'observed', parseFloat(e.target.value) || 0)}
                      className="input py-1 text-sm font-mono w-36"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-slate-700">
                    {calc.error >= 0 ? `+${calc.error.toFixed(4)}` : calc.error.toFixed(4)} {app.instrument?.unit}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-mono font-bold ${
                      calc.isWithin ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {calc.errorPct >= 0 ? `+${calc.errorPct.toFixed(2)}%` : `${calc.errorPct.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {calc.isWithin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Within ±{tolerance}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Exceeds Limit
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(calc.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation summary bar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-600" />
            <span>Formula: <code>error = observed - standard</code> | <code>error% = (error / standard) * 100</code></span>
          </div>
          <div className="font-medium">
            Max Recorded Deviation: <span className="font-bold text-slate-900">{maxErrorPct.toFixed(3)}%</span> (Allowed: ±{tolerance}%)
          </div>
        </div>
      </div>

      {/* Large Result Banner & Certificate Generation */}
      <div className={`card p-7 border-2 transition-all ${
        evaluatedResult === 'PASS'
          ? 'border-emerald-500 bg-emerald-50/30'
          : 'border-rose-500 bg-rose-50/30'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md ${
              evaluatedResult === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {evaluatedResult === 'PASS' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {evaluatedResult === 'PASS' ? 'VERIFIED / PASS' : 'FAILED / NON-COMPLIANT'}
                </h2>
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  Rule-Based Engine
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {evaluatedResult === 'PASS'
                  ? `All ${rows.length} test points comply strictly within the legal limit of ±${tolerance}%.`
                  : `One or more test points exceed maximum permissible error limit of ±${tolerance}%. Calibration failed.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Submit / Save Test button */}
            <button
              type="button"
              onClick={handleSubmitInspection}
              disabled={submitting}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              {submitting ? 'Recording...' : 'Record Test Results'}
            </button>

            {/* Issue Certificate button */}
            {evaluatedResult === 'PASS' && (
              <button
                type="button"
                onClick={handleIssueCertificate}
                disabled={issuedCertLoading}
                className="btn-success py-2.5 px-6 text-sm font-bold shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                {issuedCertLoading ? 'Generating Certificate...' : 'Issue Verification Certificate'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
