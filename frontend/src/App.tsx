import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import BusinessDashboard from './pages/BusinessDashboard'
import RegisterInstrument from './pages/RegisterInstrument'
import BusinessApplications from './pages/BusinessApplications'
import OfficerDashboard from './pages/OfficerDashboard'
import ApplicationReview from './pages/ApplicationReview'
import InspectionPage from './pages/InspectionPage'
import CertificatePage from './pages/CertificatePage'
import PublicVerify from './pages/PublicVerify'
import AdminDashboard from './pages/AdminDashboard'
import GATCDashboard from './pages/GATCDashboard'
import Repository from './pages/Repository'
import ArchitectureView from './pages/ArchitectureView'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '10px',
          },
        }}
      />
      <Routes>
        {/* Landing / Role Entry */}
        <Route path="/" element={<Landing />} />

        {/* Business Owner Routes */}
        <Route path="/business" element={<BusinessDashboard />} />
        <Route path="/business/register" element={<RegisterInstrument />} />
        <Route path="/business/applications" element={<BusinessApplications />} />

        {/* Legal Metrology Officer Routes */}
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="/officer/applications" element={<OfficerDashboard />} />
        <Route path="/officer/applications/:id" element={<ApplicationReview />} />
        <Route path="/officer/inspection/:id" element={<InspectionPage />} />
        <Route path="/officer/scheduled" element={<OfficerDashboard />} />
        <Route path="/officer/verified" element={<OfficerDashboard />} />

        {/* GATC Test Centre Routes */}
        <Route path="/gatc" element={<GATCDashboard />} />
        <Route path="/gatc/inspection/:id" element={<InspectionPage />} />

        {/* State Controller Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Central Repository */}
        <Route path="/repository" element={<Repository />} />

        {/* Architecture / Technical Docs */}
        <Route path="/architecture" element={<ArchitectureView />} />

        {/* Certificate View */}
        <Route path="/certificate/:id" element={<CertificatePage />} />

        {/* Public Verification */}
        <Route path="/verify" element={<PublicVerify />} />
        <Route path="/verify/:certificateId" element={<PublicVerify />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
