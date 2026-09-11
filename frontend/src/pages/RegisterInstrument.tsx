import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { createInstrument } from '../api'
import toast from 'react-hot-toast'
import { Upload, Info } from 'lucide-react'

const INSTRUMENT_TYPES = [
  'Electronic Weighing Scale',
  'Platform Weighing Machine',
  'Measuring Tape',
  'Fuel Dispenser',
  'Weighbridge',
  'Water Meter',
  'Thermometer',
  'Pressure Gauge',
]

const UNITS = ['kg', 'g', 'tonne', 'litre', 'ml', 'm', 'cm', 'bar']

export default function RegisterInstrument() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fileName, setFileName] = useState('')
  const [form, setForm] = useState({
    type: 'Electronic Weighing Scale',
    manufacturer: '',
    model: '',
    serial_number: '',
    capacity: '',
    unit: 'kg',
    owner_name: '',
    business_name: '',
    address: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.manufacturer || !form.model || !form.serial_number || !form.capacity || !form.owner_name || !form.business_name || !form.address) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (fileRef.current?.files?.[0]) {
      fd.append('document', fileRef.current.files[0])
    }

    try {
      const result = await createInstrument(fd)
      toast.success(`Application ${result.application_ref} submitted!`)
      navigate('/business')
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      role="business"
      title="Register Instrument"
      subtitle="Submit a new verification application for your weighing or measuring instrument"
    >
      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Instrument Details */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Instrument Details
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="label">Instrument Type <span className="text-red-500">*</span></label>
              <select name="type" value={form.type} onChange={handleChange} className="input">
                {INSTRUMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Manufacturer <span className="text-red-500">*</span></label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="e.g. Essae Teraoka" className="input" />
            </div>
            <div>
              <label className="label">Model <span className="text-red-500">*</span></label>
              <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. ER-315" className="input" />
            </div>
            <div>
              <label className="label">Serial Number <span className="text-red-500">*</span></label>
              <input name="serial_number" value={form.serial_number} onChange={handleChange} placeholder="e.g. SN-2024-001" className="input" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Capacity <span className="text-red-500">*</span></label>
                <input name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="150" className="input" min="0" step="0.01" />
              </div>
              <div className="w-28">
                <label className="label">Unit</label>
                <select name="unit" value={form.unit} onChange={handleChange} className="input">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Owner / Business */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Owner &amp; Business Details
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="label">Owner Name <span className="text-red-500">*</span></label>
              <input name="owner_name" value={form.owner_name} onChange={handleChange} placeholder="Full name" className="input" />
            </div>
            <div>
              <label className="label">Business Name <span className="text-red-500">*</span></label>
              <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Registered business name" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Address <span className="text-red-500">*</span></label>
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Full address including PIN code" className="input h-20 resize-none" />
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            Upload Previous Certificate (Optional)
          </h2>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            {fileName ? (
              <p className="text-sm font-medium text-brand-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm text-slate-500 font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6 mb-6">
          <label className="label">Additional Notes (Optional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional information about this instrument..." className="input h-24 resize-none" />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">What happens next?</p>
            <p className="text-blue-600 text-xs leading-relaxed">
              After submission, your application will be reviewed by a Legal Metrology Officer. If approved, an inspection will be scheduled at your premises or the nearest test centre. Once verified, a digital certificate with QR code will be issued.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-8 py-2.5">
            {submitting ? 'Submitting...' : 'Submit Verification Application'}
          </button>
          <button type="button" onClick={() => navigate('/business')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  )
}
