import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "./i18n/LanguageContext";
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

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [inspectionAppId, setInspectionAppId] = useState<number | null>(null);

  const navigate = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "execution") setInspectionAppId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const launchInspection = (appId: number) => {
    setInspectionAppId(appId);
    setActiveTab("execution");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":         return <HomePage onNavigate={navigate} />;
      case "applicant":    return <ApplicantDashboard onNavigateToInspect={launchInspection} />;
      case "inspector":    return <InspectorDashboard onSelectInspection={launchInspection} />;
      case "execution":    return inspectionAppId
        ? <InspectionExecution applicationId={inspectionAppId} onBack={() => navigate("inspector")} />
        : null;
      case "high_capacity": return <HighCapacityCalculator />;
      case "diagnostics":  return <DiagnosticsPage />;
      case "admin":        return <AdminDashboard />;
      case "audit":        return <AuditLogViewer />;
      case "verify":       return <PublicVerify />;
      case "certificates": return <CertificatePage />;
      default:             return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-ivory">
      <Navbar activeTab={activeTab} setActiveTab={navigate} />

      <main className={`flex-1 ${activeTab === "home" ? "" : "max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-12"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {activeTab !== "home" && (
        <footer className="border-t border-iron bg-charcoal py-8 px-6 lg:px-12">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <button onClick={() => navigate("home")} className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 bg-amber flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
              </div>
              <span className="font-display font-bold text-sm text-fog group-hover:text-amber transition-colors">MetroVerify</span>
            </button>
            <div className="font-mono text-[11px] text-steel text-right leading-relaxed">
              <div>Legal Metrology Act, 2009 · General Rules 2011 (Amendment 2026)</div>
              <div className="text-[#2a2a2a] mt-0.5">Hackathon prototype · Not an official government portal</div>
            </div>
          </div>
        </footer>
      )}
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
