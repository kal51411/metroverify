import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { Navbar } from "./components/Navbar";
import { ApplicantDashboard } from "./pages/ApplicantDashboard";
import { InspectorDashboard } from "./pages/InspectorDashboard";
import { InspectionExecution } from "./pages/InspectionExecution";
import { HighCapacityCalculator } from "./pages/HighCapacityCalculator";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuditLogViewer } from "./pages/AuditLogViewer";
import { PublicVerify } from "./pages/PublicVerify";

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("applicant");
  const [activeInspectionAppId, setActiveInspectionAppId] = useState<number | null>(null);

  const handleLaunchInspection = (appId: number) => {
    setActiveInspectionAppId(appId);
    setActiveTab("execution");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        if (tab !== "execution") setActiveInspectionAppId(null);
      }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "applicant" && (
          <ApplicantDashboard onNavigateToInspect={handleLaunchInspection} />
        )}
        {activeTab === "inspector" && (
          <InspectorDashboard onSelectInspection={handleLaunchInspection} />
        )}
        {activeTab === "execution" && activeInspectionAppId && (
          <InspectionExecution
            applicationId={activeInspectionAppId}
            onBack={() => setActiveTab("inspector")}
          />
        )}
        {activeTab === "high_capacity" && <HighCapacityCalculator />}
        {activeTab === "diagnostics" && <DiagnosticsPage />}
        {activeTab === "admin" && <AdminDashboard />}
        {activeTab === "audit" && <AuditLogViewer />}
        {activeTab === "verify" && <PublicVerify />}
      </main>

      <footer className="border-t border-slate-800 bg-[#0f172a] py-6 text-center text-xs text-slate-500 space-y-2">
        <div>
          <b>MetroVerify v2 Platform</b> — Legal Metrology Digital Verification & Audit Ledger Framework
        </div>
        <div className="text-[11px] text-slate-600">
          Government of Maharashtra Legal Metrology Directorate Alignment | Legal Metrology Act, 2009 & General Rules 2011 (Amended 2025/2026)
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
