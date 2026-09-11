export type UserRole = 'business' | 'officer' | 'public'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'UNDER_INSPECTION'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED'

export type Priority = 'LOW' | 'NORMAL' | 'HIGH'
export type InspectionResult = 'PASS' | 'FAIL'

export interface Instrument {
  id: number
  instrument_id: string
  type: string
  manufacturer: string
  model: string
  serial_number: string
  capacity: number
  unit: string
  owner_name: string
  business_name: string
  address: string
  created_at: string
}

export interface Application {
  id: number
  application_id: string
  instrument_id: number
  status: ApplicationStatus
  submitted_at: string
  inspection_date?: string
  inspection_time?: string
  test_centre?: string
  assigned_officer?: string
  priority: Priority
  notes?: string
  document_path?: string
  reviewed_at?: string
  scheduled_at?: string
  instrument?: Instrument
  certificate?: Certificate
}

export interface InspectionResultRow {
  id: number
  standard_value: number
  observed_value: number
  error: number
  error_percentage: number
  within_tolerance: boolean
}

export interface Inspection {
  id: number
  inspection_id: string
  application_id: number
  officer: string
  tolerance: number
  result?: InspectionResult
  max_error_percentage?: number
  created_at: string
  completed_at?: string
  results: InspectionResultRow[]
}

export interface Certificate {
  id: number
  certificate_id: string
  instrument_id: number
  application_id: number
  verification_date: string
  valid_until: string
  result: string
  qr_token: string
  officer: string
  test_centre: string
  created_at: string
  instrument?: Instrument
}

export interface VerifyResponse {
  certificate_id: string
  instrument_id: string
  instrument_type: string
  manufacturer: string
  model: string
  serial_number: string
  owner_name: string
  business_name: string
  verification_date: string
  valid_until: string
  result: string
  officer: string
  test_centre: string
  is_valid: boolean
  is_expired: boolean
  status_label: string
}

export interface BusinessStats {
  total_instruments: number
  total_applications: number
  under_verification: number
  verified: number
  expiring_soon: number
}

export interface OfficerStats {
  pending: number
  scheduled: number
  under_inspection: number
  verified: number
  failed: number
  expiring_soon: number
}
