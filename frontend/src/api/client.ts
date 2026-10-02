const BASE_URL = ""

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    let errMsg = "An error occurred";
    try {
      const err = await res.json();
      errMsg = err.detail || err.message || JSON.stringify(err);
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  getInstruments: () => apiFetch<any[]>("/api/instruments"),
  getInstrument: (id: number) => apiFetch<any>(`/api/instruments/${id}`),
  createInstrument: (data: any) => apiFetch<any>("/api/instruments", { method: "POST", body: JSON.stringify(data) }),
  getTestPlan: (id: number) => apiFetch<any>(`/api/instruments/${id}/test-plan`),
  getFeeEstimate: (id: number, isPremises: boolean) => apiFetch<any>(`/api/instruments/${id}/fee-estimate?is_premises=${isPremises}`),
  
  getApplications: (status?: string) => apiFetch<any[]>(`/api/applications${status ? `?status=${status}` : ""}`),
  getApplication: (id: number) => apiFetch<any>(`/api/applications/${id}`),
  getStats: () => apiFetch<any>("/api/applications/stats/summary"),
  createApplication: (data: any) => apiFetch<any>("/api/applications", { method: "POST", body: JSON.stringify(data) }),
  approveApplication: (id: number) => apiFetch<any>(`/api/applications/${id}/approve`, { method: "PATCH" }),
  rejectApplication: (id: number, reason: string) => apiFetch<any>(`/api/applications/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  scheduleApplication: (id: number, data: any) => apiFetch<any>(`/api/applications/${id}/schedule`, { method: "PATCH", body: JSON.stringify(data) }),
  recordPayment: (id: number, data: any) => apiFetch<any>(`/api/applications/${id}/payments`, { method: "POST", body: JSON.stringify(data) }),
  raiseQuery: (id: number, query_text: string) => apiFetch<any>(`/api/applications/${id}/queries`, { method: "POST", body: JSON.stringify({ query_text }) }),
  respondQuery: (id: number, queryId: string, response_text: string) => apiFetch<any>(`/api/applications/${id}/queries/${queryId}/respond`, { method: "PATCH", body: JSON.stringify({ response_text }) }),
  
  getInspectionByApp: (appId: number) => apiFetch<any>(`/api/inspections/application/${appId}`),
  startInspection: (appId: number) => apiFetch<any>(`/api/inspections/application/${appId}/start`, { method: "POST" }),
  completeInspection: (appId: number, data: any) => apiFetch<any>(`/api/inspections/application/${appId}/complete`, { method: "POST", body: JSON.stringify(data) }),
  correctMeasurement: (measId: number, data: any) => apiFetch<any>(`/api/inspections/measurements/${measId}/correct`, { method: "PATCH", body: JSON.stringify(data) }),
  
  getStandards: () => apiFetch<any[]>("/api/standards"),
  createStandard: (data: any) => apiFetch<any>("/api/standards", { method: "POST", body: JSON.stringify(data) }),
  
  getCertificates: () => apiFetch<any[]>("/api/certificates"),
  getCertificate: (id: number) => apiFetch<any>(`/api/certificates/${id}`),
  generateCertificate: (appId: number) => apiFetch<any>(`/api/certificates/application/${appId}/generate`, { method: "POST" }),
  getCertificateQr: (id: number) => apiFetch<any>(`/api/certificates/${id}/qr`),
  
  verifyPublic: (ref: string) => apiFetch<any>(`/api/verify/${encodeURIComponent(ref)}`),
  
  calculateMPE: (load: number, e: number, accuracy_class: string) => apiFetch<any>(`/api/rulesets/mpe/calculate?load=${load}&e=${e}&accuracy_class=${accuracy_class}`),
  evaluateHighCapacity: (max: number, e: number, r1: number, r2: number, r3: number) => apiFetch<any>(`/api/rulesets/high-capacity/substitution?max_capacity=${max}&e=${e}&r1=${r1}&r2=${r2}&r3=${r3}`),
  
  getAuditEvents: () => apiFetch<any[]>("/api/audit"),
  verifyAuditChain: () => apiFetch<any>("/api/audit/verify-chain"),
  
  analyzeSignal: (samples: number[]) => apiFetch<any>("/api/diagnostics/signal-stability", { method: "POST", body: JSON.stringify(samples) }),
  evaluateCreep: (load: number, start: number, end: number, duration: number) => apiFetch<any>(`/api/diagnostics/creep?load_kg=${load}&start_reading_kg=${start}&end_reading_kg=${end}&duration_minutes=${duration}`)
};
