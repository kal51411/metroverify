import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "./i18n/LanguageContext";
import { NavbarV3 } from "./v3/NavbarV3";
import { HeroV3 } from "./v3/HeroV3";
import { TelemetryDashboard } from "./v3/TelemetryDashboard";
import { AIInspectionAssistant } from "./v3/AIInspectionAssistant";
import { MetrologyCopilot } from "./v3/MetrologyCopilot";
import { GeoInspectionModal } from "./v3/GeoInspectionModal";
import { FooterV3 } from "./v3/FooterV3";

// v2 Pages fully preserved with zero regression
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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeInOut" as const } },
};

const MainContentV3: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [inspectionAppId, setInspectionAppId] = useState<number | null>(null);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

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
      case "home":           return <HeroV3 onNavigate={navigate} />;
      case "telemetry":      return <TelemetryDashboard />;
      case "ai-assistant":   return <AIInspectionAssistant />;
      case "applicant":      return <ApplicantDashboard onNavigateToInspect={launchInspection} />;
      case "inspector":      return <InspectorDashboard onSelectInspection={launchInspection} />;
      case "execution":      return inspectionAppId
        ? <InspectionExecution applicationId={inspectionAppId} onBack={() => navigate("inspector")} />
        : <InspectorDashboard onSelectInspection={launchInspection} />;
      case "high_capacity":  return <HighCapacityCalculator />;
      case "diagnostics":    return <DiagnosticsPage />;
      case "admin":          return <AdminDashboard />;
      case "audit":          return <AuditLogViewer />;
      case "verify":         return <PublicVerify />;
      case "certificates":   return <CertificatePage />;
      default:               return <HeroV3 onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] text-[#FAFAFA] font-sans selection:bg-cyan-500 selection:text-black">
      <NavbarV3 
        activeTab={activeTab} 
        setActiveTab={navigate} 
        onOpenGeoModal={() => setIsGeoModalOpen(true)}
      />

      <main className="flex-1">
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

      {/* Floating AI Metrology Copilot Drawer */}
      <MetrologyCopilot />

      {/* Geo-Tagged Inspection Modal */}
      <GeoInspectionModal
        isOpen={isGeoModalOpen}
        onClose={() => setIsGeoModalOpen(false)}
        applicationId={inspectionAppId || 1}
        instrumentId={1}
      />

      {/* Dedicated v3 Statutory Footer */}
      <FooterV3 />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainContentV3 />
    </LanguageProvider>
  );
}
