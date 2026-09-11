import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingPage, ErrorState } from '../components/ui/States'
import { getApplication, approveApplication, rejectApplication, scheduleInspection } from '../api'
import type { Application } from '../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Building,
  Scale,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Bot
} from 'lucide-react'

export default function ApplicationReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Scheduling Form with GATC vs LMO options
  const [scheduleData, setScheduleData] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: '11:00 AM',
    test_centre: 'State Legal Metrology Lab, Shivaji Nagar, Pune',
    officer: 'Smt. Kavitha Nair (Inspector Grade-I)',
    allocated_to_type: 'LMO',
    gatc_name: '',
  })

  // Optional AI assistant extraction demo
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  useEffect(() => {
    if (id) loadApplication(parseInt(id))
  }, [id])

  const loadApplication = (appId: number) => {
    setLoading(true)
    getApplication(appId)
      .then(setApp)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading) return <Layout role="officer"><LoadingPage /></Layout>
  if (error || !app) return <Layout role="officer"><ErrorState message={error || 'Application not found'} /></Layout>

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await approveApplication(app.id)
      toast.success('Application approved. You can now schedule the inspection.')
      loadApplication(app.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('Please enter reason for rejection:')
    if (!reason) return
    setActionLoading(true)
    try {
      await rejectApplication(app.id, reason)
      toast.error('Application has been rejected.')
      loadApplication(app.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Rejection failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await scheduleInspection(app.id, scheduleData)
      toast.success('Inspection successfully scheduled!')
      loadApplication(app.id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Scheduling failed')
    } finally {
      setActionLoading(false)
    }
  }

  const simulateAiExtraction = () => {
    setAiAnalyzing(true)
    setTimeout(() => {
      setAiAnalyzing(false)
      setShowAiAssistant(true)
      toast.success('AI Document analysis completed!')
    }, 1200)
  }

  // Timeline steps
  const steps = [
    { key: 'SUBMITTED', label: 'Application Submitted', done: true },
    { key: 'UNDER_REVIEW', label: 'Document Review', done: ['UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'UNDER_INSPECTION', 'VERIFIED', 'FAILED'].includes(app.status) },
    { key: 'APPROVED', label: 'Officer Approval', done: ['APPROVED', 'SCHEDULED', 'UNDER_INSPECTION', 'VERIFIED', 'FAILED'].includes(app.status) },
    { key: 'SCHEDULED', label: 'Inspection Scheduled', done: ['SCHEDULED', 'UNDER_INSPECTION', 'VERIFIED', 'FAILED'].includes(app.status) },
    { key: 'UNDER_INSPECTION', label: 'Digital Inspection', done: ['UNDER_INSPECTION', 'VERIFIED', 'FAILED'].includes(app.status) },
    { key: 'VERIFIED', label: 'Certificate Issued', done: app.status === 'VERIFIED' },
  ]

  return (
    <Layout
      role="officer"
      title={`Application Review: ${app.application_id}`}
      subtitle="Verify submitted technical documents and assign verification schedule"
      actions={
        <button
          onClick={() => navigate('/officer')}
          className="btn-secondary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </button>
      }
    >
      {/* Workflow Progress Timeline */}
      <div className="card p-6 mb-7">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Verification Workflow Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                  step.done
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>
              <span className={`text-[11px] font-medium leading-tight ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instrument Specs Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Instrument Specifications</h3>
                  <p className="text-xs text-slate-500">ID: {app.instrument?.instrument_id}</p>
                </div>
              </div>
              <StatusBadge status={app.status} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Instrument Type</span>
                <span className="font-medium text-slate-800">{app.instrument?.type}</span>
              </div>
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Manufacturer</span>
                <span className="font-medium text-slate-800">{app.instrument?.manufacturer}</span>
              </div>
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Model Number</span>
                <span className="font-medium text-slate-800">{app.instrument?.model}</span>
              </div>
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Serial Number</span>
                <span className="font-mono font-medium text-brand-700">{app.instrument?.serial_number}</span>
              </div>
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Maximum Capacity</span>
                <span className="font-medium text-slate-800">{app.instrument?.capacity} {app.instrument?.unit}</span>
              </div>
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Application Priority</span>
                <span className="font-semibold text-amber-700">{app.priority}</span>
              </div>
            </div>
          </div>

          {/* Business & Location Card */}
          <div className="card p-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Applicant & Premise Details</h3>
                <p className="text-xs text-slate-500">Commercial entity requesting verification</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Registered Business</span>
                <span className="font-semibold text-slate-800 text-base">{app.instrument?.business_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Owner / Authorized Representative</span>
                <span className="font-medium text-slate-800">{app.instrument?.owner_name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block">Physical Premise Address</span>
                <span className="text-slate-700 font-normal">{app.instrument?.address}</span>
              </div>
            </div>
          </div>

          {/* Uploaded Document / Verification History */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Uploaded Documentation</h3>
                  <p className="text-xs text-slate-500">Certificate of previous calibration & invoice</p>
                </div>
              </div>

              {/* AI Assistant Button */}
              <button
                type="button"
                onClick={simulateAiExtraction}
                disabled={aiAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-medium hover:from-violet-700 hover:to-indigo-700 shadow-sm transition-all"
              >
                <Bot className="w-3.5 h-3.5" />
                {aiAnalyzing ? 'Analyzing Document...' : 'AI Document Assistant'}
              </button>
            </div>

            {/* Document preview card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {app.document_path ? app.document_path.split('/').pop() : 'Previous_Verification_Certificate.pdf'}
                  </p>
                  <p className="text-xs text-slate-400">Attached by Applicant · Verification Record</p>
                </div>
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                Verified Format
              </span>
            </div>

            {/* AI Assistant Extraction Results */}
            {showAiAssistant && (
              <div className="mt-4 p-4 rounded-xl bg-violet-50/70 border border-violet-200 text-xs animate-fade-in">
                <div className="flex items-center gap-1.5 text-violet-800 font-semibold mb-2">
                  <Bot className="w-4 h-4" />
                  <span>AI Extracted Metadata (Automated Document OCR)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><strong className="text-slate-900">Detected Instrument:</strong> {app.instrument?.type}</p>
                  <p><strong className="text-slate-900">Serial Match:</strong> {app.instrument?.serial_number} (100% confidence)</p>
                  <p><strong className="text-slate-900">Last Stamped:</strong> 12-OCT-2023</p>
                  <p><strong className="text-slate-900">Tamper Seal:</strong> Intact & Recorded</p>
                </div>
                <p className="text-[10px] text-violet-600 mt-2 italic">
                  Note: AI assisted extraction is for officer advisory only. Legal decisions require human authorization.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Decision & Scheduling Actions */}
        <div className="space-y-6">
          {/* Approval Controls */}
          {['SUBMITTED', 'UNDER_REVIEW'].includes(app.status) && (
            <div className="card p-6 border-brand-200 bg-brand-50/20">
              <h3 className="font-semibold text-slate-900 text-base mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Officer Evaluation
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Review applicant documents and decide whether to approve for physical inspection.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full btn-primary py-2.5 justify-center text-sm shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="w-full btn-secondary py-2.5 justify-center text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </button>
              </div>
            </div>
          )}

          {/* Inspection Scheduling Form (When APPROVED) */}
          {app.status === 'APPROVED' && (
            <div className="card p-6 border-violet-200 bg-violet-50/20">
              <h3 className="font-semibold text-slate-900 text-base mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Schedule &amp; Allocate Verification
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Allocate verification to a State Metrology Officer (LMO) or Govt Approved Test Centre (GATC) under Sec. 24.
              </p>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                {/* Allocation Type Switcher */}
                <div className="bg-white p-3 rounded-xl border border-violet-200">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Testing Authority Allocation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleData({
                        ...scheduleData,
                        allocated_to_type: 'LMO',
                        test_centre: 'State Legal Metrology Lab, Shivaji Nagar, Pune',
                        officer: 'Smt. Kavitha Nair (Inspector Grade-I)',
                        gatc_name: '',
                      })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        scheduleData.allocated_to_type === 'LMO'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      State LMO Officer
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleData({
                        ...scheduleData,
                        allocated_to_type: 'GATC',
                        test_centre: 'National Test House (GATC Centre #04), Mumbai',
                        officer: 'Er. D. S. Mehta (Chief Metrologist)',
                        gatc_name: 'National Test House (GATC #04)',
                      })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        scheduleData.allocated_to_type === 'GATC'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      GATC Test Centre
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label text-xs">Inspection Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleData.inspection_date}
                    onChange={(e) => setScheduleData({ ...scheduleData, inspection_date: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Inspection Time Slot</label>
                  <input
                    type="text"
                    required
                    value={scheduleData.inspection_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, inspection_time: e.target.value })}
                    className="input text-xs"
                    placeholder="e.g. 10:30 AM - 12:00 PM"
                  />
                </div>

                <div>
                  <label className="label text-xs">
                    {scheduleData.allocated_to_type === 'GATC' ? 'Notified GATC Facility' : 'Designated State Test Centre'}
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleData.test_centre}
                    onChange={(e) => setScheduleData({ ...scheduleData, test_centre: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">
                    {scheduleData.allocated_to_type === 'GATC' ? 'GATC Certified Metrologist' : 'Assigned Metrology Officer'}
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleData.officer}
                    onChange={(e) => setScheduleData({ ...scheduleData, officer: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full btn-primary py-2.5 justify-center bg-violet-600 hover:bg-violet-700 text-sm mt-2 shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Confirm &amp; Allocate to {scheduleData.allocated_to_type === 'GATC' ? 'GATC Centre' : 'LMO Officer'}
                </button>
              </form>
            </div>
          )}

          {/* If already scheduled: Quick link to inspection */}
          {['SCHEDULED', 'UNDER_INSPECTION'].includes(app.status) && (
            <div className="card p-6 border-orange-200 bg-orange-50/20">
              <h3 className="font-semibold text-slate-900 text-base mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Inspection Scheduled
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Scheduled for <strong>{app.inspection_date}</strong> at <strong>{app.inspection_time}</strong>.
                <br />
                Location: {app.test_centre}
              </p>

              <button
                type="button"
                onClick={() => navigate(`/officer/inspection/${app.id}`)}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                Perform Digital Inspection
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* If already verified: Quick link to certificate */}
          {app.status === 'VERIFIED' && (
            <div className="card p-6 border-green-200 bg-green-50/20 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Inspection Passed</h3>
              <p className="text-xs text-slate-600 mb-4">
                This instrument has passed all legal metrology error tolerance tests.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/certificate/${app.id}`)}
                className="w-full btn-success py-2.5 justify-center text-sm"
              >
                View Verification Certificate
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
