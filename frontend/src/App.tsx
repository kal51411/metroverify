import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { ApplicantDashboard } from "./pages/ApplicantDashboard";
import { InspectorDashboard } from "./pages/InspectorDashboard";
import { InspectionExecution } from "./pages/InspectionExecution";
import { HighCapacityCalculator } from "./pages/HighCapacityCalculator";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuditLogViewer } from "./pages/AuditLogViewer";
import { PublicVerify } from "./pages/PublicVerify";
import { CertificatePage } from "./pages/CertificatePage";

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [activeInspectionAppId, setActiveInspectionAppId] = useState<number | null>(null);

  const handleLaunchInspection = (appId: number) => {
    setActiveInspectionAppId(appId);
    setActiveTab("execution");
  };

  const navigate = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "execution") setActiveInspectionAppId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={navigate} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "home" && <HomePage onNavigate={navigate} />}
        {activeTab === "applicant" && <ApplicantDashboard onNavigateToInspect={handleLaunchInspection} />}
        {activeTab === "inspector" && <InspectorDashboard onSelectInspection={handleLaunchInspection} />}
        {activeTab === "execution" && activeInspectionAppId && (
          <InspectionExecution
            applicationId={activeInspectionAppId}
            onBack={() => navigate("inspector")}
          />
        )}
        {activeTab === "high_capacity" && <HighCapacityCalculator />}
        {activeTab === "diagnostics" && <DiagnosticsPage />}
        {activeTab === "admin" && <AdminDashboard />}
        {activeTab === "audit" && <AuditLogViewer />}
        {activeTab === "verify" && <PublicVerify />}
        {activeTab === "certificates" && <CertificatePage />}
      </main>

      <footer className="border-t border-slate-800 bg-[#05080e] py-6 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-sm text-slate-300">METROVERIFY v2</div>
            <div className="font-mono text-[11px] text-slate-600 mt-0.5">Digital Legal Metrology Verification & Audit Ledger System</div>
          </div>
          <div className="font-mono text-[11px] text-slate-600 text-right">
            <div>Aligned with Legal Metrology Act, 2009 & General Rules 2011 (Amended 2025/2026)</div>
            <div className="mt-0.5">Maharashtra Enforcement Framework | Rule 2026.4 | SHA-256 Audit Chain</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
}
