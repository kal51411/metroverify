import axios from 'axios'
import type {
  Instrument,
  Application,
  Inspection,
  Certificate,
  VerifyResponse,
  BusinessStats,
  OfficerStats,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ---- Instruments ----
export const getInstruments = () => api.get<Instrument[]>('/instruments').then(r => r.data)
export const getInstrument = (id: number) => api.get<Instrument>(`/instruments/${id}`).then(r => r.data)
export const createInstrument = (formData: FormData) =>
  api.post<{ instrument_id: number; instrument_ref: string; application_id: number; application_ref: string; message: string }>(
    '/instruments',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data)

// ---- Applications ----
export const getApplications = (status?: string) =>
  api.get<Application[]>('/applications', { params: status && status !== 'ALL' ? { status } : {} }).then(r => r.data)
export const getApplication = (id: number) => api.get<Application>(`/applications/${id}`).then(r => r.data)
export const approveApplication = (id: number) => api.patch(`/applications/${id}/approve`).then(r => r.data)
export const rejectApplication = (id: number, notes?: string) =>
  api.patch(`/applications/${id}/reject`, { notes }).then(r => r.data)
export const scheduleInspection = (id: number, data: {
  inspection_date: string
  inspection_time: string
  test_centre: string
  officer: string
}) => api.patch(`/applications/${id}/schedule`, data).then(r => r.data)
export const getBusinessStats = () => api.get<BusinessStats>('/applications/stats/business').then(r => r.data)
export const getOfficerStats = () => api.get<OfficerStats>('/applications/stats/officer').then(r => r.data)

// ---- Inspections ----
export const getInspectionByApplication = (appId: number) =>
  api.get<Inspection>(`/inspections/application/${appId}`).then(r => r.data)
export const startInspection = (appId: number) =>
  api.post(`/inspections/application/${appId}/start`).then(r => r.data)
export const completeInspection = (appId: number, data: {
  officer: string
  tolerance: number
  results: { standard_value: number; observed_value: number }[]
}) => api.post(`/inspections/application/${appId}/complete`, data).then(r => r.data)

// ---- Certificates ----
export const getCertificate = (id: number) => api.get<Certificate>(`/certificates/${id}`).then(r => r.data)
export const getCertificateQR = (id: number) =>
  api.get<{ qr_code: string; url: string }>(`/certificates/${id}/qr`).then(r => r.data)
export const generateCertificate = (appId: number) =>
  api.post<{ certificate_id: number; certificate_ref: string; message: string }>(
    `/certificates/application/${appId}/generate`
  ).then(r => r.data)
export const getCertificatePdfUrl = (id: number) => `/api/certificates/${id}/pdf`

// ---- Public Verify ----
export const verifyCertificate = (certificateRef: string) =>
  api.get<VerifyResponse>(`/verify/${certificateRef}`).then(r => r.data)

export default api
